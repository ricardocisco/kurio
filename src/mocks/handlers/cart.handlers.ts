import { http } from 'msw';

import {
  addCartItemInputSchema,
  applyCouponInputSchema,
  GUEST_CART_HEADER,
  mergeCartInputSchema,
  updateCartItemInputSchema,
  type Cart,
  type CartNotice,
} from '@/shared/contracts/cart';
import type { NftEdition } from '@/shared/contracts/nft';

import { readDatabase, updateDatabase, type CartRecord } from '../db/database';
import { findCoupon, isCouponExpired } from '../fixtures/coupons';
import { apiPath } from '../utils/api-path';
import { authenticate } from '../utils/auth';
import { buildCart, emptyCartRecord, findEdition, maxAllowedQuantity } from '../utils/cart-builder';
import { errorResponse, jsonResponse } from '../utils/responses';

interface CartOwner {
  key: string;
  cartId: string;
}

function resolveCartOwner(request: Request): CartOwner | Response {
  if (request.headers.has('Authorization')) {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    return { key: `user:${auth.user.id}`, cartId: `cart-${auth.user.id}` };
  }
  const guestCartId = request.headers.get(GUEST_CART_HEADER);
  if (!guestCartId) {
    return errorResponse('VALIDATION_ERROR', 'Identificador do carrinho ausente.');
  }
  return { key: `guest:${guestCartId}`, cartId: `cart-guest-${guestCartId}` };
}

function readCart(owner: CartOwner): CartRecord {
  return readDatabase().carts[owner.key] ?? emptyCartRecord(owner.cartId);
}

function saveCart(owner: CartOwner, mutate: (cart: CartRecord) => void): CartRecord {
  return updateDatabase((draft) => {
    const cart = draft.carts[owner.key] ?? emptyCartRecord(owner.cartId);
    mutate(cart);
    cart.version += 1;
    cart.updatedAt = new Date().toISOString();
    draft.carts[owner.key] = cart;
    return cart;
  });
}

function respond(record: CartRecord, notices: CartNotice[] = []) {
  return jsonResponse<Cart>(buildCart(record, readDatabase().nfts, notices));
}

function quantityError(edition: NftEdition, quantity: number) {
  if (edition.available === 0) {
    return errorResponse('AVAILABILITY_CONFLICT', 'Esta edição está esgotada.', {
      details: { available: 0 },
    });
  }
  if (quantity > edition.maxPerOrder) {
    return errorResponse('VALIDATION_ERROR', `Máximo de ${edition.maxPerOrder} por pedido.`, {
      fieldErrors: { quantity: [`Máximo de ${edition.maxPerOrder} por pedido.`] },
      details: { maxPerOrder: edition.maxPerOrder },
    });
  }
  if (quantity > edition.available) {
    return errorResponse(
      'AVAILABILITY_CONFLICT',
      edition.available === 1
        ? 'Apenas 1 unidade disponível desta edição.'
        : `Apenas ${edition.available} unidades disponíveis desta edição.`,
      { details: { available: edition.available } },
    );
  }
  return null;
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

export const cartHandlers = [
  http.get(apiPath('/cart'), ({ request }) => {
    const owner = resolveCartOwner(request);
    if (owner instanceof Response) return owner;

    const record = readCart(owner);
    const coupon = record.couponCode ? findCoupon(record.couponCode) : undefined;
    if (coupon && isCouponExpired(coupon)) {
      const updated = saveCart(owner, (cart) => {
        cart.couponCode = null;
      });
      return respond(updated, [
        { type: 'coupon-removed', message: `O cupom ${coupon.code} expirou e foi removido.` },
      ]);
    }
    return respond(record);
  }),

  http.post(apiPath('/cart/items'), async ({ request }) => {
    const owner = resolveCartOwner(request);
    if (owner instanceof Response) return owner;
    const parsed = addCartItemInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Item inválido.');

    const { nftId, editionId, quantity } = parsed.data;
    const found = findEdition(readDatabase().nfts, nftId, editionId);
    if (!found) return errorResponse('NOT_FOUND', 'NFT ou edição não encontrados.');

    const lineId = `${nftId}:${editionId}`;
    const existing = readCart(owner).lines.find((line) => line.id === lineId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    const error = quantityError(found.edition, nextQuantity);
    if (error) return error;

    const record = saveCart(owner, (cart) => {
      const line = cart.lines.find((item) => item.id === lineId);
      if (line) {
        line.quantity = nextQuantity;
        line.priceAtAdd = found.edition.price;
      } else {
        cart.lines.push({
          id: lineId,
          nftId,
          editionId,
          quantity,
          priceAtAdd: found.edition.price,
        });
      }
    });
    return respond(record);
  }),

  http.patch<{ lineId: string }>(apiPath('/cart/items/:lineId'), async ({ request, params }) => {
    const owner = resolveCartOwner(request);
    if (owner instanceof Response) return owner;
    const parsed = updateCartItemInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Alteração inválida.');

    const line = readCart(owner).lines.find((item) => item.id === params.lineId);
    if (!line) return errorResponse('NOT_FOUND', 'Item não encontrado no carrinho.');
    const found = findEdition(readDatabase().nfts, line.nftId, line.editionId);
    if (!found) return errorResponse('NOT_FOUND', 'NFT ou edição não encontrados.');

    const { quantity, acknowledgePriceChange } = parsed.data;
    if (quantity !== undefined && quantity > line.quantity) {
      const error = quantityError(found.edition, quantity);
      if (error) return error;
    }

    const record = saveCart(owner, (cart) => {
      const target = cart.lines.find((item) => item.id === params.lineId);
      if (!target) return;
      if (quantity !== undefined) target.quantity = quantity;
      if (acknowledgePriceChange) target.priceAtAdd = found.edition.price;
    });
    return respond(record);
  }),

  http.delete<{ lineId: string }>(apiPath('/cart/items/:lineId'), ({ request, params }) => {
    const owner = resolveCartOwner(request);
    if (owner instanceof Response) return owner;
    const record = saveCart(owner, (cart) => {
      cart.lines = cart.lines.filter((line) => line.id !== params.lineId);
    });
    return respond(record);
  }),

  http.put(apiPath('/cart/coupon'), async ({ request }) => {
    const owner = resolveCartOwner(request);
    if (owner instanceof Response) return owner;
    const parsed = applyCouponInputSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Informe um código promocional.', {
        fieldErrors: { code: ['Informe um código promocional.'] },
      });
    }

    if (readCart(owner).lines.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Adicione itens antes de aplicar um cupom.', {
        fieldErrors: { code: ['Adicione itens antes de aplicar um cupom.'] },
      });
    }

    const coupon = findCoupon(parsed.data.code);
    if (!coupon) {
      return errorResponse('COUPON_INVALID', 'Cupom inválido.', {
        fieldErrors: { code: ['Cupom inválido. Confira o código e tente novamente.'] },
      });
    }
    if (isCouponExpired(coupon)) {
      const message = `Este cupom expirou em ${dateFormatter.format(new Date(coupon.expiresAt))}.`;
      return errorResponse('COUPON_EXPIRED', message, { fieldErrors: { code: [message] } });
    }

    const record = saveCart(owner, (cart) => {
      cart.couponCode = coupon.code;
    });
    return respond(record);
  }),

  http.delete(apiPath('/cart/coupon'), ({ request }) => {
    const owner = resolveCartOwner(request);
    if (owner instanceof Response) return owner;
    const record = saveCart(owner, (cart) => {
      cart.couponCode = null;
    });
    return respond(record);
  }),

  http.post(apiPath('/cart/merge'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = mergeCartInputSchema.safeParse(await readJson(request));
    if (!parsed.success)
      return errorResponse('VALIDATION_ERROR', 'Carrinho de visitante inválido.');

    const owner: CartOwner = { key: `user:${auth.user.id}`, cartId: `cart-${auth.user.id}` };
    const guestKey = `guest:${parsed.data.guestCartId}`;
    const guestCart = readDatabase().carts[guestKey];
    if (!guestCart || guestCart.lines.length === 0) return respond(readCart(owner));

    const { nfts } = readDatabase();
    let mergedUnits = 0;
    let cappedLines = 0;
    const record = saveCart(owner, (cart) => {
      for (const guestLine of guestCart.lines) {
        const found = findEdition(nfts, guestLine.nftId, guestLine.editionId);
        if (!found) continue;
        const limit = maxAllowedQuantity(found.edition);
        const existing = cart.lines.find((line) => line.id === guestLine.id);
        const desired = (existing?.quantity ?? 0) + guestLine.quantity;
        const quantity = Math.min(desired, limit);
        if (quantity < desired) cappedLines += 1;
        if (quantity <= 0) continue;
        mergedUnits += quantity - (existing?.quantity ?? 0);
        if (existing) {
          existing.quantity = quantity;
        } else {
          cart.lines.push({ ...guestLine, quantity });
        }
      }
    });
    updateDatabase((draft) => {
      delete draft.carts[guestKey];
    });

    const notices: CartNotice[] = [
      {
        type: 'lines-merged',
        message:
          cappedLines > 0
            ? `Juntamos ${mergedUnits} item(ns) do seu carrinho de visitante. Algumas quantidades foram ajustadas ao estoque disponível.`
            : `Juntamos ${mergedUnits} item(ns) do seu carrinho de visitante à sua conta.`,
      },
    ];
    return respond(record, notices);
  }),
];
