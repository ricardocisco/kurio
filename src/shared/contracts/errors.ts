import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'EMAIL_ALREADY_REGISTERED',
  'USERNAME_ALREADY_TAKEN',
  'INVALID_CREDENTIALS',
  'AVAILABILITY_CONFLICT',
  'QUOTE_OUTDATED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'IDEMPOTENCY_KEY_REUSED',
  'PAYMENT_DECLINED',
  'WALLET_REJECTED',
  'WALLET_DISCONNECTED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
