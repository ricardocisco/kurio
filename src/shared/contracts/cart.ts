import { z } from 'zod';

import {
  ethAmountSchema,
  isoDateTimeSchema,
  nonNegativeIntSchema,
  positiveIntSchema,
} from './common';
import { nftImageSchema } from './nft';

export const cartLineIssueSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('price-changed'), previousUnitPrice: ethAmountSchema }),
  z.object({ type: z.literal('insufficient-stock'), available: nonNegativeIntSchema }),
  z.object({ type: z.literal('sold-out') }),
]);
export type CartLineIssue = z.infer<typeof cartLineIssueSchema>;

export const cartLineSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  editionLabel: z.string(),
  image: nftImageSchema,
  unitPrice: ethAmountSchema,
  quantity: positiveIntSchema,
  lineTotal: ethAmountSchema,
  available: nonNegativeIntSchema,
  maxPerOrder: positiveIntSchema,
  issues: z.array(cartLineIssueSchema),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const appliedCouponSchema = z.object({
  code: z.string(),
  description: z.string(),
  percentage: z.number().positive().max(100),
});
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>;

export const cartSummarySchema = z.object({
  itemCount: nonNegativeIntSchema,
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
});
export type CartSummary = z.infer<typeof cartSummarySchema>;

export const cartNoticeSchema = z.object({
  type: z.enum(['coupon-removed', 'lines-merged']),
  message: z.string(),
});
export type CartNotice = z.infer<typeof cartNoticeSchema>;

export const cartSchema = z.object({
  id: z.string(),
  lines: z.array(cartLineSchema),
  coupon: appliedCouponSchema.nullable(),
  summary: cartSummarySchema,
  notices: z.array(cartNoticeSchema),
  hasBlockingIssues: z.boolean(),
  version: positiveIntSchema,
  updatedAt: isoDateTimeSchema,
});
export type Cart = z.infer<typeof cartSchema>;

export const addCartItemInputSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().positive(),
});
export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>;

export const updateCartItemInputSchema = z.object({
  quantity: z.number().int().positive().optional(),
  acknowledgePriceChange: z.boolean().optional(),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

export const applyCouponInputSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, 'Informe um código promocional.').max(20),
});
export type ApplyCouponInput = z.infer<typeof applyCouponInputSchema>;

export const mergeCartInputSchema = z.object({ guestCartId: z.string().min(1) });

export const GUEST_CART_HEADER = 'X-Guest-Cart-Id';
