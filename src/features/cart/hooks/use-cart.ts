import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks/use-session';
import { announce } from '@/shared/a11y/announce';
import type {
  AddCartItemInput,
  ApplyCouponInput,
  Cart,
  UpdateCartItemInput,
} from '@/shared/contracts/cart';

import {
  addCartItem,
  applyCoupon,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '../api/cart.api';
import { cartQueryOptions } from '../api/cart.queries';
import { cartQueryKey, type CartOwner } from '../model/cart-owner';
import { ensureGuestCartId } from '../model/guest-cart-id';

export function useCartOwner(): CartOwner | null {
  const { user, isResolving } = useSession();
  if (isResolving) return null;
  return user
    ? { kind: 'user', userId: user.id }
    : { kind: 'guest', guestCartId: ensureGuestCartId() };
}

export function useCart() {
  const owner = useCartOwner();
  const cart = useQuery({
    ...cartQueryOptions(owner ?? { kind: 'guest', guestCartId: 'pending' }),
    enabled: owner !== null,
  });
  return { owner, cart, isResolving: owner === null || cart.isPending };
}

function useCartMutation<TVariables>(
  mutate: (owner: CartOwner, variables: TVariables) => Promise<Cart>,
  successMessage?: (variables: TVariables, cart: Cart) => string,
) {
  const queryClient = useQueryClient();
  const owner = useCartOwner();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      if (!owner) throw new Error('Cart owner is not resolved yet');
      return mutate(owner, variables);
    },
    onSuccess: (cart, variables) => {
      if (owner) queryClient.setQueryData(cartQueryKey(owner), cart);
      if (successMessage) announce(successMessage(variables, cart));
    },
  });
}

export function useAddToCart() {
  return useCartMutation(
    (owner, input: AddCartItemInput & { name: string }) =>
      addCartItem(owner, {
        nftId: input.nftId,
        editionId: input.editionId,
        quantity: input.quantity,
      }),
    (input) => `${input.name} adicionado ao carrinho.`,
  );
}

export function useUpdateCartLine() {
  return useCartMutation(
    (owner, { lineId, ...input }: UpdateCartItemInput & { lineId: string }) =>
      updateCartItem(owner, lineId, input),
    (variables, cart) => {
      const line = cart.lines.find((item) => item.id === variables.lineId);
      return variables.quantity !== undefined && line
        ? `Quantidade de ${line.name} alterada para ${line.quantity}.`
        : 'Carrinho atualizado.';
    },
  );
}

export function useRemoveCartLine() {
  return useCartMutation(
    (owner, { lineId }: { lineId: string; name: string }) => removeCartItem(owner, lineId),
    ({ name }) => `${name} removido do carrinho.`,
  );
}

export function useApplyCoupon() {
  return useCartMutation(
    (owner, input: ApplyCouponInput) => applyCoupon(owner, input),
    (_input, cart) => `Cupom ${cart.coupon?.code ?? ''} aplicado. Total atualizado.`,
  );
}

export function useRemoveCoupon() {
  return useCartMutation(
    (owner, _variables: void) => removeCoupon(owner),
    () => 'Cupom removido.',
  );
}
