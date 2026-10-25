import { z } from 'zod';

import {
  ethAmountSchema,
  isoDateTimeSchema,
  nonNegativeIntSchema,
  positiveIntSchema,
} from './common';
import { orderSchema } from './orders';

const envelope = <TType extends string, TResource extends string, TPayload extends z.ZodType>(
  type: TType,
  resource: TResource,
  payload: TPayload,
) =>
  z.object({
    eventId: z.string().min(1),
    type: z.literal(type),
    resource: z.literal(resource),
    resourceId: z.string().min(1),
    version: positiveIntSchema,
    occurredAt: isoDateTimeSchema,
    userId: z.string().nullable(),
    payload,
  });

export const nftUpdatedEventSchema = envelope(
  'nft.updated',
  'nft',
  z.object({
    nftId: z.string(),
    price: ethAmountSchema,
    isSoldOut: z.boolean(),
    editions: z.array(
      z.object({ id: z.string(), price: ethAmountSchema, available: nonNegativeIntSchema }),
    ),
  }),
);
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>;

export const orderUpdatedEventSchema = envelope('order.updated', 'order', orderSchema);
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>;

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
]);
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
  subscribe: 'session.subscribe',
  unsubscribe: 'session.unsubscribe',
  subscribed: 'session.subscribed',
  subscriptionRejected: 'session.rejected',
} as const;

export const sessionSubscribedSchema = z.object({ userId: z.string().nullable() });
