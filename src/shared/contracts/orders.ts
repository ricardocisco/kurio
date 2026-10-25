import { z } from 'zod';

import { appliedCouponSchema, cartSummarySchema } from './cart';
import { purchaseLineSchema } from './checkout';
import { isoDateTimeSchema, positiveIntSchema } from './common';
import { networkIdSchema } from './nft';
import { walletProviderSchema } from './wallets';

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: positiveIntSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  network: networkIdSchema,
  wallet: z.object({ provider: walletProviderSchema, address: z.string() }),
  collector: z.object({ displayName: z.string(), email: z.string() }),
  lines: z.array(purchaseLineSchema).min(1),
  coupon: appliedCouponSchema.nullable(),
  summary: cartSummarySchema,
  transaction: z
    .object({ hash: z.string(), explorerUrl: z.string(), confirmedAt: isoDateTimeSchema })
    .nullable(),
  declineReason: z.string().nullable(),
});
export type Order = z.infer<typeof orderSchema>;

export function isOrderFinal(status: OrderStatus): boolean {
  return status === 'confirmed' || status === 'declined';
}
