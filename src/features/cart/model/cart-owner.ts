import { privateQueryKey } from '@/shared/api/private-scope';

export type CartOwner = { kind: 'user'; userId: string } | { kind: 'guest'; guestCartId: string };

export function cartQueryKey(owner: CartOwner) {
  return owner.kind === 'user'
    ? privateQueryKey(owner.userId, 'cart')
    : (['cart', 'guest', owner.guestCartId] as const);
}
