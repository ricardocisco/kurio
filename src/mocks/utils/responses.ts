import { HttpResponse } from 'msw';

import type { ApiErrorBody, ApiErrorCode } from '@/shared/contracts/errors';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  EMAIL_ALREADY_REGISTERED: 409,
  USERNAME_ALREADY_TAKEN: 409,
  INVALID_CREDENTIALS: 401,
  AVAILABILITY_CONFLICT: 409,
  QUOTE_OUTDATED: 409,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  IDEMPOTENCY_KEY_REUSED: 409,
  PAYMENT_DECLINED: 402,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

interface ErrorOptions {
  status?: number;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;
}

export function errorResponse(code: ApiErrorCode, message: string, options: ErrorOptions = {}) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(options.fieldErrors && { fieldErrors: options.fieldErrors }),
      ...(options.details && { details: options.details }),
    },
  };
  return HttpResponse.json(body, { status: options.status ?? STATUS_BY_CODE[code] });
}

export function jsonResponse<TBody>(body: TBody, init?: ResponseInit) {
  return HttpResponse.json(body as Record<string, unknown>, init);
}
