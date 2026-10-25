import type { Cart } from '@/shared/contracts/cart';
import type { CheckoutQuote, PurchaseLine } from '@/shared/contracts/checkout';
import type { NetworkId } from '@/shared/contracts/nft';
import type { Order } from '@/shared/contracts/orders';

import { readDatabase, updateDatabase, type DatabaseState, type OrderRecord } from '../db/database';
import { createNftUpdatedEvent, createOrderUpdatedEvent } from '../realtime/events';
import { onRealtimeSubscription, publishRealtimeEvent } from '../realtime/socket-server';

import { buildCart, emptyCartRecord } from './cart-builder';

export const QUOTE_TTL_MS = 5 * 60 * 1000;
export const ORDER_PROCESSING_MS = 2500;

export function userCartKey(userId: string): string {
  return `user:${userId}`;
}

export function currentUserCart(userId: string): Cart {
  const { carts, nfts } = readDatabase();
  return buildCart(carts[userCartKey(userId)] ?? emptyCartRecord(`cart-${userId}`), nfts);
}

export function toPurchaseLines(cart: Cart): PurchaseLine[] {
  return cart.lines.map((line) => ({
    lineId: line.id,
    nftId: line.nftId,
    editionId: line.editionId,
    name: line.name,
    tokenId: line.tokenId,
    editionLabel: line.editionLabel,
    image: line.image,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));
}

export function pricingFingerprint(
  cart: Pick<Cart, 'coupon' | 'summary'> & { lines: PurchaseLine[] | Cart['lines'] },
): string {
  return JSON.stringify({
    lines: cart.lines.map((line) => [line.nftId, line.editionId, line.quantity, line.unitPrice]),
    coupon: cart.coupon?.code ?? null,
    summary: cart.summary,
  });
}

export function createQuote(userId: string, network: NetworkId, cart: Cart): CheckoutQuote {
  const now = Date.now();
  const quote: CheckoutQuote = {
    id: `quote-${crypto.randomUUID()}`,
    network,
    lines: toPurchaseLines(cart),
    coupon: cart.coupon,
    summary: cart.summary,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  };
  updateDatabase((draft) => {
    draft.quotes[quote.id] = { userId, quote, fingerprint: pricingFingerprint(cart) };
  });
  return quote;
}

function fakeTransactionHash(orderId: string): string {
  let hash = '';
  let seed = 0;
  for (const char of orderId) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  while (hash.length < 64) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    hash += seed.toString(16).padStart(8, '0');
  }
  return `0x${hash.slice(0, 64)}`;
}

function applyConfirmedOrder(draft: DatabaseState, record: OrderRecord): void {
  for (const line of record.order.lines) {
    const nft = draft.nfts.find((item) => item.id === line.nftId);
    const edition = nft?.editions.find((item) => item.id === line.editionId);
    if (nft && edition) {
      edition.available = Math.max(0, edition.available - line.quantity);
      nft.isSoldOut = nft.editions.every((item) => item.available === 0);
      nft.version += 1;
    }
  }

  const cart = draft.carts[userCartKey(record.userId)];
  if (cart) {
    cart.lines = cart.lines.flatMap((cartLine) => {
      const purchased = record.order.lines.find((line) => line.lineId === cartLine.id);
      if (!purchased) return [cartLine];
      const remaining = cartLine.quantity - purchased.quantity;
      return remaining > 0 ? [{ ...cartLine, quantity: remaining }] : [];
    });
    if (cart.lines.length === 0) cart.couponCode = null;
    cart.version += 1;
    cart.updatedAt = new Date().toISOString();
  }
}

const scheduledOrders = new Set<string>();

export function scheduleOrderResolution(orderId: string): void {
  const record = readDatabase().orders[orderId];
  if (record?.order.status !== 'pending' || scheduledOrders.has(orderId)) return;
  scheduledOrders.add(orderId);
  const delayMs = Math.max(0, new Date(record.resolveAt).getTime() - Date.now());
  setTimeout(() => {
    scheduledOrders.delete(orderId);
    resolveOrderIfDue(orderId);
  }, delayMs);
}

onRealtimeSubscription((userId) => {
  Object.entries(readDatabase().orders)
    .filter(([, record]) => record.userId === userId && record.order.status === 'pending')
    .forEach(([orderId]) => scheduleOrderResolution(orderId));
});

function publishOrderResolution(record: OrderRecord): void {
  publishRealtimeEvent(createOrderUpdatedEvent(record.order, record.userId));
  if (record.order.status !== 'confirmed') return;
  const { nfts } = readDatabase();
  for (const nftId of new Set(record.order.lines.map((line) => line.nftId))) {
    const nft = nfts.find((item) => item.id === nftId);
    if (nft) publishRealtimeEvent(createNftUpdatedEvent(nft));
  }
}

export function resolveOrderIfDue(orderId: string): Order | undefined {
  const record = readDatabase().orders[orderId];
  if (!record) return undefined;
  if (record.order.status !== 'pending' || Date.now() < new Date(record.resolveAt).getTime()) {
    return record.order;
  }

  const resolved = updateDatabase((draft) => {
    const target = draft.orders[orderId];
    if (target?.order.status !== 'pending') return null;
    const now = new Date().toISOString();
    if (target.outcome === 'confirmed') {
      const hash = fakeTransactionHash(target.order.id);
      target.order = {
        ...target.order,
        status: 'confirmed',
        version: target.order.version + 1,
        updatedAt: now,
        transaction: {
          hash,
          explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
          confirmedAt: now,
        },
      };
      applyConfirmedOrder(draft, target);
    } else {
      target.order = {
        ...target.order,
        status: 'declined',
        version: target.order.version + 1,
        updatedAt: now,
        declineReason: 'A rede recusou a transação: saldo insuficiente na carteira simulada.',
      };
    }
    return structuredClone(target);
  });

  if (!resolved) return readDatabase().orders[orderId]?.order;
  publishOrderResolution(resolved);
  return resolved.order;
}
