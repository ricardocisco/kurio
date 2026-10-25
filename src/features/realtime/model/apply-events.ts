import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { nftKeys } from '@/features/nfts/api/nft.queries';
import { orderQueryOptions } from '@/features/orders/api/orders.queries';
import { PRIVATE_QUERY_ROOT } from '@/shared/api/private-scope';
import type { Cart } from '@/shared/contracts/cart';
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/contracts/events';
import type { NftDetail, NftSummary } from '@/shared/contracts/nft';
import { isEthEqual } from '@/shared/lib/money';

export interface CartImpact {
  name: string;
  previousPrice: string;
  newPrice: string;
  available: number;
  quantity: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSummary(value: unknown): value is NftSummary {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.version === 'number' &&
    'price' in value
  );
}

function patchSummary<TItem>(item: TItem, event: NftUpdatedEvent): TItem {
  if (!isSummary(item) || item.id !== event.payload.nftId || item.version >= event.version)
    return item;
  return {
    ...item,
    price: event.payload.price,
    isSoldOut: event.payload.isSoldOut,
    version: event.version,
  };
}

function patchCollections(data: unknown, event: NftUpdatedEvent): unknown {
  if (!isRecord(data)) return data;
  if (Array.isArray(data.items)) {
    return { ...data, items: data.items.map((item: unknown) => patchSummary(item, event)) };
  }
  if (Array.isArray(data.heroSlides) && 'spotlight' in data) {
    return {
      ...data,
      heroSlides: data.heroSlides.map((item: unknown) => patchSummary(item, event)),
      spotlight: patchSummary(data.spotlight, event),
    };
  }
  return data;
}

function patchDetail(detail: NftDetail | undefined, event: NftUpdatedEvent): NftDetail | undefined {
  if (!detail || detail.version >= event.version) return detail;
  const updates = new Map(event.payload.editions.map((edition) => [edition.id, edition]));
  return {
    ...detail,
    price: event.payload.price,
    isSoldOut: event.payload.isSoldOut,
    version: event.version,
    editions: detail.editions.map((edition) => {
      const update = updates.get(edition.id);
      return update ? { ...edition, price: update.price, available: update.available } : edition;
    }),
  };
}

function isCartKey(queryKey: QueryKey): boolean {
  return queryKey.includes('cart');
}

function isSummaryCollectionKey(queryKey: QueryKey): boolean {
  const [root, second, , third] = queryKey;
  if (root === nftKeys.all[0]) {
    return (
      second === 'list' || second === 'featured' || (second === 'detail' && third === 'related')
    );
  }
  return root === PRIVATE_QUERY_ROOT && queryKey[2] === 'favorites';
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): CartImpact[] {
  const { nftId } = event.payload;

  queryClient.setQueryData<NftDetail>(nftKeys.detail(nftId), (detail) =>
    patchDetail(detail, event),
  );
  queryClient.setQueriesData(
    { predicate: (query) => isSummaryCollectionKey(query.queryKey) },
    (data: unknown) => patchCollections(data, event),
  );

  const impacts: CartImpact[] = [];
  for (const [queryKey, cart] of queryClient.getQueriesData<Cart>({
    predicate: (query) => isCartKey(query.queryKey),
  })) {
    const lines = cart?.lines.filter((line) => line.nftId === nftId) ?? [];
    if (lines.length === 0) continue;
    for (const line of lines) {
      const edition = event.payload.editions.find((item) => item.id === line.editionId);
      if (!edition) continue;
      const priceChanged = !isEthEqual(edition.price, line.unitPrice);
      const stockChanged = edition.available !== line.available;
      if (priceChanged || stockChanged) {
        impacts.push({
          name: line.name,
          previousPrice: line.unitPrice,
          newPrice: edition.price,
          available: edition.available,
          quantity: line.quantity,
        });
      }
    }
    void queryClient.invalidateQueries({ queryKey, exact: true });
  }
  return impacts;
}

export function applyOrderUpdated(
  queryClient: QueryClient,
  event: OrderUpdatedEvent,
  userId: string,
): boolean {
  const { queryKey } = orderQueryOptions(userId, event.resourceId);
  const current = queryClient.getQueryData(queryKey);
  if (current && current.version >= event.version) return false;
  queryClient.setQueryData(queryKey, event.payload);
  return true;
}

export function reconcileAfterReconnect(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: nftKeys.all });
  void queryClient.invalidateQueries({ predicate: (query) => isCartKey(query.queryKey) });
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === PRIVATE_QUERY_ROOT && query.queryKey[2] === 'orders',
  });
}
