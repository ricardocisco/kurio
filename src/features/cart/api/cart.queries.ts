import { queryOptions } from '@tanstack/react-query';

import { cartQueryKey, type CartOwner } from '../model/cart-owner';

import { fetchCart } from './cart.api';

export function cartQueryOptions(owner: CartOwner) {
  return queryOptions({
    queryKey: cartQueryKey(owner),
    queryFn: ({ signal }) => fetchCart(owner, signal),
    staleTime: 10_000,
  });
}
