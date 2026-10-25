import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cartQueryKey } from '@/features/cart/model/cart-owner';
import { nftKeys } from '@/features/nfts/api/nft.queries';
import { orderQueryOptions } from '@/features/orders/api/orders.queries';
import { announce } from '@/shared/a11y/announce';
import { isApiError } from '@/shared/api/api-error';
import {
  checkoutQuoteSchema,
  type CheckoutFormOutput,
  type CheckoutQuote,
  type CreateOrderInput,
  type WalletConnection,
} from '@/shared/contracts/checkout';
import type { Order } from '@/shared/contracts/orders';
import { onAcceptedNftUpdate } from '@/shared/realtime/realtime-bus';

import { connectWallet, createOrder, createQuote, disconnectWallet } from '../api/checkout.api';
import {
  clearCheckoutAttempt,
  clearCheckoutDraft,
  readCheckoutAttempt,
  saveCheckoutAttempt,
} from '../model/checkout-storage';

export type CheckoutFlowState =
  | { step: 'idle' }
  | { step: 'quoting' }
  | {
      step: 'review';
      quote: CheckoutQuote;
      previousQuote: CheckoutQuote | null;
      connection: WalletConnection | null;
      isConnecting: boolean;
      notice: string | null;
      walletError: string | null;
    }
  | { step: 'submitting'; message: string | null }
  | { step: 'pending'; orderId: string }
  | { step: 'declined'; order: Order }
  | { step: 'failed'; message: string; action: 'retry' | 'cart' | 'restart' };

const MAX_SUBMIT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1200;
const SLOW_CONFIRMATION_MESSAGE =
  'A confirmação está demorando. Verificando o mesmo pedido, sem criar outra compra…';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback;
}

function quoteFingerprint(quote: CheckoutQuote): string {
  return JSON.stringify([
    quote.summary.total,
    quote.lines.map((line) => [line.lineId, line.unitPrice, line.quantity]),
  ]);
}

function toCollector(form: CheckoutFormOutput): CreateOrderInput['collector'] {
  return {
    displayName: form.displayName,
    username: form.username,
    email: form.email,
    ensName: form.ensName,
    referralCode: form.referralCode,
    note: form.note,
  };
}

export function useCheckoutFlow(userId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [state, setState] = useState<CheckoutFlowState>(() => {
    const attempt = readCheckoutAttempt(userId);
    if (attempt?.orderId) return { step: 'pending', orderId: attempt.orderId };
    if (attempt) return { step: 'submitting', message: 'Retomando seu pedido…' };
    return { step: 'idle' };
  });
  const isSubmitting = useRef(false);

  const pendingOrderId = state.step === 'pending' ? state.orderId : null;
  const pendingOrder = useQuery({
    ...orderQueryOptions(userId, pendingOrderId ?? 'none'),
    enabled: pendingOrderId !== null,
  });

  const refreshPurchaseData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: cartQueryKey({ kind: 'user', userId }) });
    void queryClient.invalidateQueries({ queryKey: nftKeys.all });
  }, [queryClient, userId]);

  useEffect(() => {
    const order = pendingOrder.data;
    if (order?.id !== pendingOrderId || !order) return;
    if (order.status === 'confirmed') {
      clearCheckoutAttempt();
      clearCheckoutDraft();
      refreshPurchaseData();
      announce('Pagamento confirmado.');
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id }, replace: true });
    } else if (order.status === 'declined') {
      clearCheckoutAttempt();
      announce('Pagamento recusado.');
    }
  }, [navigate, pendingOrder.data, pendingOrderId, refreshPurchaseData]);

  const submit = useCallback(
    async (
      request: CreateOrderInput,
      idempotencyKey: string,
      review: Extract<CheckoutFlowState, { step: 'review' }> | null,
    ) => {
      if (isSubmitting.current) return;
      isSubmitting.current = true;
      saveCheckoutAttempt({ userId, idempotencyKey, request, orderId: null });
      setState({ step: 'submitting', message: null });

      try {
        for (let attempt = 1; attempt <= MAX_SUBMIT_ATTEMPTS; attempt += 1) {
          try {
            const order = await createOrder(request, idempotencyKey);
            saveCheckoutAttempt({ userId, idempotencyKey, request, orderId: order.id });
            setState({ step: 'pending', orderId: order.id });
            announce('Pedido enviado. Aguardando confirmação da rede.');
            return;
          } catch (error) {
            if (isApiError(error) && error.isRetryable && attempt < MAX_SUBMIT_ATTEMPTS) {
              setState({ step: 'submitting', message: SLOW_CONFIRMATION_MESSAGE });
              announce(SLOW_CONFIRMATION_MESSAGE);
              await sleep(RETRY_DELAY_MS);
              continue;
            }
            throw error;
          }
        }
      } catch (error) {
        if (isApiError(error) && error.isAuthError) return;

        if (isApiError(error) && error.code === 'QUOTE_OUTDATED') {
          clearCheckoutAttempt();
          const fresh = checkoutQuoteSchema.safeParse(error.details.quote);
          if (!review || !fresh.success) {
            setState({ step: 'failed', message: error.message, action: 'restart' });
            return;
          }
          {
            announce('Os valores do pedido mudaram. Confira e confirme novamente.');
            setState({
              ...review,
              quote: fresh.data,
              previousQuote: review.quote,
              notice: error.message,
              walletError: null,
            });
            return;
          }
        }

        if (isApiError(error) && error.code === 'WALLET_DISCONNECTED' && review) {
          clearCheckoutAttempt();
          setState({ ...review, connection: null, walletError: error.message, notice: null });
          return;
        }

        if (isApiError(error) && error.code === 'AVAILABILITY_CONFLICT') {
          clearCheckoutAttempt();
          refreshPurchaseData();
          setState({ step: 'failed', message: error.message, action: 'cart' });
          return;
        }

        if (
          isApiError(error) &&
          (error.code === 'IDEMPOTENCY_KEY_REUSED' || error.code === 'NOT_FOUND')
        ) {
          clearCheckoutAttempt();
          setState({ step: 'failed', message: error.message, action: 'restart' });
          return;
        }

        setState({
          step: 'failed',
          message: errorMessage(error, 'Não foi possível enviar o pedido.'),
          action: 'retry',
        });
      } finally {
        isSubmitting.current = false;
      }
    },
    [refreshPurchaseData, userId],
  );

  useEffect(() => {
    if (state.step !== 'submitting' || isSubmitting.current) return;
    const attempt = readCheckoutAttempt(userId);
    if (!attempt || attempt.orderId) return;
    const timer = setTimeout(() => void submit(attempt.request, attempt.idempotencyKey, null), 0);
    return () => clearTimeout(timer);
  }, [state.step, submit, userId]);

  const reviewQuote = state.step === 'review' ? state.quote : null;

  useEffect(() => {
    if (!reviewQuote) return;
    return onAcceptedNftUpdate((event) => {
      const line = reviewQuote.lines.find((item) => item.nftId === event.payload.nftId);
      if (!line) return;
      createQuote({ network: reviewQuote.network })
        .then((fresh) => {
          setState((current) => {
            if (current.step !== 'review' || current.quote.id !== reviewQuote.id) return current;
            if (quoteFingerprint(fresh) === quoteFingerprint(current.quote)) return current;
            const notice = `O preço de ${line.name} mudou durante a revisão. Confira os novos valores.`;
            announce(notice);
            return { ...current, quote: fresh, previousQuote: current.quote, notice };
          });
        })
        .catch((error: unknown) => {
          if (!isApiError(error) || error.code !== 'AVAILABILITY_CONFLICT') return;
          refreshPurchaseData();
          setState((current) =>
            current.step === 'review' && current.quote.id === reviewQuote.id
              ? { step: 'failed', message: error.message, action: 'cart' }
              : current,
          );
        });
    });
  }, [refreshPurchaseData, reviewQuote]);

  const startReview = useCallback(
    async (form: CheckoutFormOutput) => {
      setState({ step: 'quoting' });
      try {
        const quote = await createQuote({ network: form.network });
        setState({
          step: 'review',
          quote,
          previousQuote: null,
          connection: null,
          isConnecting: false,
          notice: null,
          walletError: null,
        });
      } catch (error) {
        if (isApiError(error) && error.isAuthError) return;
        const toCart = isApiError(error) && error.code === 'AVAILABILITY_CONFLICT';
        if (toCart) refreshPurchaseData();
        setState({
          step: 'failed',
          message: errorMessage(error, 'Não foi possível revisar o pedido.'),
          action: toCart ? 'cart' : 'restart',
        });
      }
    },
    [refreshPurchaseData],
  );

  const connect = useCallback(
    async (form: CheckoutFormOutput) => {
      if (state.step !== 'review') return;
      const review = state;
      setState({ ...review, isConnecting: true, walletError: null });
      try {
        const connection = await connectWallet({
          provider: form.provider,
          network: form.network,
          address: form.address,
          walletId: form.useOtherWallet ? null : form.walletId,
        });
        announce('Carteira conectada.');
        setState({ ...review, connection, isConnecting: false, walletError: null });
      } catch (error) {
        setState({
          ...review,
          isConnecting: false,
          walletError: errorMessage(error, 'Não foi possível conectar a carteira.'),
        });
      }
    },
    [state],
  );

  const disconnect = useCallback(async () => {
    if (state.step !== 'review' || !state.connection) return;
    const review = state;
    await disconnectWallet(state.connection.id).catch(() => undefined);
    announce('Carteira desconectada.');
    setState({ ...review, connection: null });
  }, [state]);

  const pay = useCallback(
    (form: CheckoutFormOutput) => {
      if (state.step !== 'review' || !state.connection) return;
      const request: CreateOrderInput = {
        quoteId: state.quote.id,
        walletConnectionId: state.connection.id,
        collector: toCollector(form),
      };
      const previous = readCheckoutAttempt(userId);
      const idempotencyKey =
        previous && JSON.stringify(previous.request) === JSON.stringify(request)
          ? previous.idempotencyKey
          : crypto.randomUUID();
      void submit(request, idempotencyKey, state);
    },
    [state, submit, userId],
  );

  const retry = useCallback(() => {
    const attempt = readCheckoutAttempt(userId);
    if (attempt && !attempt.orderId) void submit(attempt.request, attempt.idempotencyKey, null);
    else setState({ step: 'idle' });
  }, [submit, userId]);

  const reset = useCallback(() => {
    if (state.step === 'review' && state.connection) {
      void disconnectWallet(state.connection.id).catch(() => undefined);
    }
    setState({ step: 'idle' });
  }, [state]);

  const declinedOrder =
    state.step === 'pending' &&
    pendingOrder.data?.id === state.orderId &&
    pendingOrder.data.status === 'declined'
      ? pendingOrder.data
      : null;
  const flowState: CheckoutFlowState = declinedOrder
    ? { step: 'declined', order: declinedOrder }
    : state;

  return { state: flowState, pendingOrder, startReview, connect, disconnect, pay, retry, reset };
}
