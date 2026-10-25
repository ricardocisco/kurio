import { queryOptions } from '@tanstack/react-query';

import { isApiError } from '@/shared/api/api-error';
import type { Session } from '@/shared/contracts/session';

import { clearSessionToken, markSessionExpired, readSessionToken } from '../model/session-token';

import { fetchSession } from './auth.api';

export const sessionKeys = {
  current: ['session'] as const,
};

export const SESSION_STALE_TIME_MS = 60_000;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKeys.current,
    queryFn: async ({ signal }): Promise<Session | null> => {
      if (!readSessionToken()) return null;
      try {
        return await fetchSession(signal);
      } catch (error) {
        if (isApiError(error) && error.isAuthError) {
          if (error.code === 'SESSION_EXPIRED') markSessionExpired();
          clearSessionToken();
          return null;
        }
        throw error;
      }
    },
    staleTime: SESSION_STALE_TIME_MS,
  });
}
