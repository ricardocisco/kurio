import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/contracts/events';
import type { NftDetail } from '@/shared/contracts/nft';
import type { Order } from '@/shared/contracts/orders';

export function createNftUpdatedEvent(
  nft: NftDetail,
  overrides: Partial<NftUpdatedEvent> = {},
): NftUpdatedEvent {
  return {
    eventId: `evt-${crypto.randomUUID()}`,
    type: 'nft.updated',
    resource: 'nft',
    resourceId: nft.id,
    version: nft.version,
    occurredAt: new Date().toISOString(),
    userId: null,
    payload: {
      nftId: nft.id,
      price: nft.price,
      isSoldOut: nft.isSoldOut,
      editions: nft.editions.map((edition) => ({
        id: edition.id,
        price: edition.price,
        available: edition.available,
      })),
    },
    ...overrides,
  };
}

export function createOrderUpdatedEvent(order: Order, userId: string): OrderUpdatedEvent {
  return {
    eventId: `evt-${crypto.randomUUID()}`,
    type: 'order.updated',
    resource: 'order',
    resourceId: order.id,
    version: order.version,
    occurredAt: new Date().toISOString(),
    userId,
    payload: order,
  };
}
