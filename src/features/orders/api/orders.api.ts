import { getJson } from '@/shared/api/http-client';
import { orderSchema, type Order } from '@/shared/contracts/orders';

export function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  return getJson(`/orders/${encodeURIComponent(orderId)}`, orderSchema, { signal });
}
