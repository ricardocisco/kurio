import type { AxiosRequestConfig } from 'axios';

import { getJson, sendJson } from '@/shared/api/http-client';
import {
  cartSchema,
  GUEST_CART_HEADER,
  type AddCartItemInput,
  type ApplyCouponInput,
  type Cart,
  type UpdateCartItemInput,
} from '@/shared/contracts/cart';

import type { CartOwner } from '../model/cart-owner';

function ownerConfig(owner: CartOwner, signal?: AbortSignal): AxiosRequestConfig {
  return {
    signal,
    headers: owner.kind === 'guest' ? { [GUEST_CART_HEADER]: owner.guestCartId } : undefined,
  };
}

const lineUrl = (lineId: string) => `/cart/items/${encodeURIComponent(lineId)}`;

export function fetchCart(owner: CartOwner, signal?: AbortSignal): Promise<Cart> {
  return getJson('/cart', cartSchema, ownerConfig(owner, signal));
}

export function addCartItem(owner: CartOwner, input: AddCartItemInput): Promise<Cart> {
  return sendJson('post', '/cart/items', cartSchema, input, ownerConfig(owner));
}

export function updateCartItem(
  owner: CartOwner,
  lineId: string,
  input: UpdateCartItemInput,
): Promise<Cart> {
  return sendJson('patch', lineUrl(lineId), cartSchema, input, ownerConfig(owner));
}

export function removeCartItem(owner: CartOwner, lineId: string): Promise<Cart> {
  return sendJson('delete', lineUrl(lineId), cartSchema, undefined, ownerConfig(owner));
}

export function applyCoupon(owner: CartOwner, input: ApplyCouponInput): Promise<Cart> {
  return sendJson('put', '/cart/coupon', cartSchema, input, ownerConfig(owner));
}

export function removeCoupon(owner: CartOwner): Promise<Cart> {
  return sendJson('delete', '/cart/coupon', cartSchema, undefined, ownerConfig(owner));
}

export function mergeGuestCart(guestCartId: string): Promise<Cart> {
  return sendJson('post', '/cart/merge', cartSchema, { guestCartId });
}
