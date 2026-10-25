import { z } from 'zod';

/**
 * Machine-readable error codes shared by the REST API (MSW handlers) and the client.
 * UI decisions are always based on `code`, never on HTTP status or message text.
 */
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
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    /** Field-level validation messages keyed by form field name. */
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
