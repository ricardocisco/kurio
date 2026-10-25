import { httpClient, sendJson } from '@/shared/api/http-client';
import {
  checkoutQuoteSchema,
  IDEMPOTENCY_KEY_HEADER,
  walletConnectionSchema,
  type CheckoutQuote,
  type CreateOrderInput,
  type CreateQuoteInput,
  type WalletConnection,
  type WalletConnectionInput,
} from '@/shared/contracts/checkout';
import { orderSchema, type Order } from '@/shared/contracts/orders';

export const ORDER_REQUEST_TIMEOUT_MS = 6000;

export function createQuote(input: CreateQuoteInput): Promise<CheckoutQuote> {
  return sendJson('post', '/checkout/quotes', checkoutQuoteSchema, input);
}

export function connectWallet(input: WalletConnectionInput): Promise<WalletConnection> {
  return sendJson('post', '/checkout/wallet-connections', walletConnectionSchema, input);
}

export async function disconnectWallet(connectionId: string): Promise<void> {
  await httpClient.delete(`/checkout/wallet-connections/${encodeURIComponent(connectionId)}`);
}

export function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
  return sendJson('post', '/orders', orderSchema, input, {
    timeout: ORDER_REQUEST_TIMEOUT_MS,
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
  });
}
