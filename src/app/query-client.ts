import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/shared/api/api-error';

const MAX_QUERY_RETRIES = 2;

/**
 * Cache policy (documented in ARCHITECTURE.md):
 * - Public catalog data is considered fresh for 30 s; detail pages refetch in the background.
 * - Queries retry only transient failures (network, timeout, 5xx), up to 2 times with backoff.
 *   4xx responses (validation, not found, auth) are final and never retried.
 * - Mutations never retry automatically: retrying a non-idempotent write could duplicate it.
 *   Order creation handles retries explicitly with an idempotency key.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          isApiError(error) && error.isRetryable && failureCount < MAX_QUERY_RETRIES,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}
