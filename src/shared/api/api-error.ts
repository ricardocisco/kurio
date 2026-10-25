import { isAxiosError } from 'axios';

import { apiErrorBodySchema, type ApiErrorCode } from '@/shared/contracts/errors';

/** Transport-level failure category, independent from the business error code. */
export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'contract';

interface ApiErrorInit {
  code: ApiErrorCode;
  message: string;
  kind: ApiErrorKind;
  status?: number | undefined;
  fieldErrors?: Record<string, string[]> | undefined;
  details?: Record<string, unknown> | undefined;
  cause?: unknown;
}

/**
 * Single error type surfaced to the application. Every Axios/validation failure is normalized
 * into an `ApiError`, so hooks and components can branch on `code` with full type safety.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly fieldErrors: Record<string, string[]>;
  readonly details: Record<string, unknown>;

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = 'ApiError';
    this.code = init.code;
    this.kind = init.kind;
    this.status = init.status;
    this.fieldErrors = init.fieldErrors ?? {};
    this.details = init.details ?? {};
  }

  /** Transient failures may be retried safely (only for idempotent requests). */
  get isRetryable(): boolean {
    if (this.kind === 'network' || this.kind === 'timeout') return true;
    return this.status !== undefined && this.status >= 500;
  }

  get isAuthError(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'SESSION_EXPIRED';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const FALLBACK_MESSAGES = {
  network: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
  timeout: 'O servidor demorou para responder. Tente novamente.',
  unknown: 'Algo deu errado. Tente novamente em instantes.',
} as const;

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return 'VALIDATION_ERROR';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 503) return 'SERVICE_UNAVAILABLE';
  return 'INTERNAL_ERROR';
}

/** Converts any thrown value from the HTTP layer into an `ApiError`. */
export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        code: 'SERVICE_UNAVAILABLE',
        kind: 'timeout',
        message: FALLBACK_MESSAGES.timeout,
        cause: error,
      });
    }

    if (!error.response) {
      return new ApiError({
        code: 'SERVICE_UNAVAILABLE',
        kind: 'network',
        message: FALLBACK_MESSAGES.network,
        cause: error,
      });
    }

    const status = error.response.status;
    const parsed = apiErrorBodySchema.safeParse(error.response.data as unknown);
    if (parsed.success) {
      const { code, message, fieldErrors, details } = parsed.data.error;
      return new ApiError({
        code,
        message,
        kind: 'http',
        status,
        fieldErrors,
        details,
        cause: error,
      });
    }

    return new ApiError({
      code: codeFromStatus(status),
      kind: 'http',
      status,
      message: FALLBACK_MESSAGES.unknown,
      cause: error,
    });
  }

  return new ApiError({
    code: 'INTERNAL_ERROR',
    kind: 'contract',
    message: FALLBACK_MESSAGES.unknown,
    cause: error,
  });
}
