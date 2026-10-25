import axios, { isCancel, type AxiosRequestConfig } from 'axios';
import type { z } from 'zod';

import { env } from '@/shared/config/env';

import { ApiError, normalizeApiError } from './api-error';

const REQUEST_TIMEOUT_MS = 10_000;

type TokenProvider = () => string | null;
type UnauthorizedListener = (error: ApiError) => void;

let getAuthToken: TokenProvider = () => null;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Lets the session feature provide the bearer token without `shared` depending on features. */
export function setAuthTokenProvider(provider: TokenProvider): void {
  getAuthToken = provider;
}

/** Subscribes to 401 responses (session expired / invalid). Returns an unsubscribe function. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
  // Arrays are sent as comma-separated values: ?categories=music,gaming
  paramsSerializer: { indexes: null, serialize: serializeParams },
});

httpClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

httpClient.interceptors.response.use(undefined, (error: unknown) => {
  // Cancellations are expected (stale queries) and must reach TanStack Query untouched.
  if (isCancel(error)) return Promise.reject(error as Error);

  const apiError = normalizeApiError(error);
  if (apiError.isAuthError) unauthorizedListeners.forEach((listener) => listener(apiError));
  return Promise.reject(apiError);
});

function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

/**
 * Validates a response payload against its contract. A mismatch is a bug between client and API,
 * so it is reported as a `contract` error instead of silently rendering malformed data.
 */
export function parseContract<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('[api] Contract violation', result.error.issues);
    throw new ApiError({
      code: 'INTERNAL_ERROR',
      kind: 'contract',
      message: 'Recebemos uma resposta inesperada do servidor.',
      cause: result.error,
    });
  }
  return result.data;
}

/** Typed GET helper: request + contract validation in one call. */
export async function getJson<TSchema extends z.ZodType>(
  url: string,
  schema: TSchema,
  config?: AxiosRequestConfig,
): Promise<z.infer<TSchema>> {
  const response = await httpClient.get<unknown>(url, config);
  return parseContract(schema, response.data);
}

/** Typed mutation helper for POST/PUT/PATCH/DELETE with contract validation. */
export async function sendJson<TSchema extends z.ZodType>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  schema: TSchema,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<z.infer<TSchema>> {
  const response = await httpClient.request<unknown>({ ...config, method, url, data: body });
  return parseContract(schema, response.data);
}
