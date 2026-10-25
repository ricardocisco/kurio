import { queryOptions } from '@tanstack/react-query';

import { privateQueryKey } from '@/shared/api/private-scope';
import { isOrderFinal } from '@/shared/contracts/orders';
import { isRealtimeConnected } from '@/shared/realtime/realtime-status';

import { fetchOrder } from './orders.api';

export const PENDING_ORDER_POLL_MS = 1000;
export const PENDING_ORDER_SAFETY_POLL_MS = 10_000;

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'orders', orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    staleTime: ({ state }) => (state.data && isOrderFinal(state.data.status) ? Infinity : 0),
    refetchInterval: ({ state }) =>
      state.data && isOrderFinal(state.data.status)
        ? false
        : isRealtimeConnected()
          ? PENDING_ORDER_SAFETY_POLL_MS
          : PENDING_ORDER_POLL_MS,
  });
}
