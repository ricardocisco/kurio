import { delay, http, HttpResponse } from 'msw';

import {
  createOrderInputSchema,
  createQuoteInputSchema,
  IDEMPOTENCY_KEY_HEADER,
  walletConnectionInputSchema,
  type CheckoutQuote,
  type WalletConnection,
} from '@/shared/contracts/checkout';
import type { Order } from '@/shared/contracts/orders';
import { isValidWalletAddress, type Wallets } from '@/shared/contracts/wallets';
import { addEth } from '@/shared/lib/money';

import { consumeOnce } from '../config/one-shot';
import { getScenarioFlags } from '../config/scenarios';
import { readDatabase, updateDatabase } from '../db/database';
import { apiPath } from '../utils/api-path';
import { authenticate } from '../utils/auth';
import { updateEdition } from '../utils/catalog-mutations';
import {
  createQuote,
  currentUserCart,
  ORDER_PROCESSING_MS,
  pricingFingerprint,
  resolveOrderIfDue,
  scheduleOrderResolution,
} from '../utils/checkout-engine';
import { errorResponse, jsonResponse } from '../utils/responses';

const ORDER_TIMEOUT_DELAY_MS = 9000;

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

function applyCheckoutScenarioHooks(userId: string): void {
  const flags = getScenarioFlags();
  const firstLine = currentUserCart(userId).lines[0];
  if (!firstLine) return;
  if (flags.priceChangeAtCheckout && consumeOnce('price-change-at-checkout')) {
    updateEdition({
      nftId: firstLine.nftId,
      editionId: firstLine.editionId,
      price: addEth(firstLine.unitPrice, '0.1'),
    });
  }
  if (flags.soldOutAtCheckout && consumeOnce('sold-out-at-checkout')) {
    updateEdition({ nftId: firstLine.nftId, editionId: firstLine.editionId, available: 0 });
  }
}

export const checkoutHandlers = [
  http.get(apiPath('/me/wallets'), ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    return jsonResponse<Wallets>({ items: readDatabase().wallets[auth.user.id] ?? [] });
  }),

  http.post(apiPath('/checkout/quotes'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = createQuoteInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Selecione uma rede válida.');

    const cart = currentUserCart(auth.user.id);
    if (cart.lines.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Seu carrinho está vazio.');
    }
    if (cart.hasBlockingIssues) {
      return errorResponse(
        'AVAILABILITY_CONFLICT',
        'Alguns itens do carrinho não têm estoque suficiente. Revise o carrinho.',
      );
    }
    return jsonResponse<CheckoutQuote>(createQuote(auth.user.id, parsed.data.network, cart), {
      status: 201,
    });
  }),

  http.post(apiPath('/checkout/wallet-connections'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = walletConnectionInputSchema.safeParse(await readJson(request));
    if (!parsed.success || !isValidWalletAddress(parsed.data.address, parsed.data.network)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Endereço de carteira inválido para a rede escolhida.',
        {
          fieldErrors: { address: ['Endereço de carteira inválido para a rede escolhida.'] },
        },
      );
    }
    if (getScenarioFlags().walletRejected) {
      return errorResponse('WALLET_REJECTED', 'A conexão foi recusada na carteira.');
    }

    const connection: WalletConnection = {
      id: `connection-${crypto.randomUUID()}`,
      provider: parsed.data.provider,
      network: parsed.data.network,
      address: parsed.data.address,
      connectedAt: new Date().toISOString(),
    };
    updateDatabase((draft) => {
      draft.walletConnections[connection.id] = { userId: auth.user.id, connection };
    });
    return jsonResponse<WalletConnection>(connection, { status: 201 });
  }),

  http.delete<{ connectionId: string }>(
    apiPath('/checkout/wallet-connections/:connectionId'),
    ({ request, params }) => {
      const auth = authenticate(request);
      if (!auth.ok) return auth.response;
      updateDatabase((draft) => {
        if (draft.walletConnections[params.connectionId]?.userId === auth.user.id) {
          delete draft.walletConnections[params.connectionId];
        }
      });
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.post(apiPath('/orders'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const userId = auth.user.id;

    const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER);
    if (!idempotencyKey) {
      return errorResponse('VALIDATION_ERROR', `O header ${IDEMPOTENCY_KEY_HEADER} é obrigatório.`);
    }
    const body = await readJson(request);
    const parsed = createOrderInputSchema.safeParse(body);
    if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Dados do pedido inválidos.');

    const requestHash = JSON.stringify(parsed.data);
    const idempotencyId = `${userId}:${idempotencyKey}`;
    const previous = readDatabase().idempotencyKeys[idempotencyId];
    if (previous) {
      if (previous.requestHash !== requestHash) {
        return errorResponse(
          'IDEMPOTENCY_KEY_REUSED',
          'Esta tentativa de compra já foi usada com outros dados.',
        );
      }
      const existing = resolveOrderIfDue(previous.orderId);
      if (existing) return jsonResponse<Order>(existing);
    }

    applyCheckoutScenarioHooks(userId);

    const { quotes, walletConnections } = readDatabase();
    const quoteRecord = quotes[parsed.data.quoteId];
    if (quoteRecord?.userId !== userId) {
      return errorResponse('NOT_FOUND', 'Cotação não encontrada. Revise o pedido novamente.');
    }

    const cart = currentUserCart(userId);
    if (cart.hasBlockingIssues || cart.lines.length === 0) {
      return errorResponse(
        'AVAILABILITY_CONFLICT',
        'Um item esgotou ou ficou sem estoque suficiente enquanto você finalizava. Revise o carrinho.',
      );
    }
    const isExpired = new Date(quoteRecord.quote.expiresAt).getTime() <= Date.now();
    if (isExpired || pricingFingerprint(cart) !== quoteRecord.fingerprint) {
      const freshQuote = createQuote(userId, quoteRecord.quote.network, cart);
      return errorResponse(
        'QUOTE_OUTDATED',
        isExpired
          ? 'A cotação expirou. Confira os valores atualizados.'
          : 'Os valores mudaram desde a revisão. Confira e confirme novamente.',
        { details: { quote: freshQuote } },
      );
    }

    const connectionRecord = walletConnections[parsed.data.walletConnectionId];
    const walletDisconnected =
      connectionRecord?.userId !== userId ||
      (getScenarioFlags().walletDisconnects && consumeOnce('wallet-disconnects'));
    if (walletDisconnected) {
      updateDatabase((draft) => {
        delete draft.walletConnections[parsed.data.walletConnectionId];
      });
      return errorResponse(
        'WALLET_DISCONNECTED',
        'A carteira foi desconectada. Conecte novamente para pagar.',
      );
    }

    const now = new Date();
    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      status: 'pending',
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      network: quoteRecord.quote.network,
      wallet: {
        provider: connectionRecord.connection.provider,
        address: connectionRecord.connection.address,
      },
      collector: {
        displayName: parsed.data.collector.displayName,
        email: parsed.data.collector.email,
      },
      lines: quoteRecord.quote.lines,
      coupon: quoteRecord.quote.coupon,
      summary: quoteRecord.quote.summary,
      transaction: null,
      declineReason: null,
    };

    updateDatabase((draft) => {
      draft.orders[order.id] = {
        userId,
        order,
        resolveAt: new Date(now.getTime() + ORDER_PROCESSING_MS).toISOString(),
        outcome: getScenarioFlags().paymentDeclined ? 'declined' : 'confirmed',
      };
      draft.idempotencyKeys[idempotencyId] = { orderId: order.id, requestHash };
      delete draft.quotes[quoteRecord.quote.id];
    });

    scheduleOrderResolution(order.id);

    if (getScenarioFlags().orderTimeout && consumeOnce('order-timeout')) {
      await delay(ORDER_TIMEOUT_DELAY_MS);
    }
    return jsonResponse<Order>(order, { status: 201 });
  }),

  http.get<{ orderId: string }>(apiPath('/orders/:orderId'), ({ request, params }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const record = readDatabase().orders[params.orderId];
    if (record?.userId !== auth.user.id) {
      return errorResponse('NOT_FOUND', 'Pedido não encontrado.');
    }
    const order = resolveOrderIfDue(params.orderId);
    return order
      ? jsonResponse<Order>(order)
      : errorResponse('NOT_FOUND', 'Pedido não encontrado.');
  }),
];
