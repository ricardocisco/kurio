import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { onUnauthorized } from '@/shared/api/http-client';

import { endSession } from '../hooks/use-auth-actions';
import { markSessionExpired, readSessionToken } from '../model/session-token';

export const PRIVATE_LAYOUT_ROUTE_ID = '/_authenticated';

export function SessionWatcher() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(
    () =>
      onUnauthorized((error) => {
        if (!readSessionToken()) return;
        if (error.code === 'SESSION_EXPIRED') markSessionExpired();
        endSession(queryClient);
        toast.warning('Sua sessão expirou. Entre novamente para continuar.');

        const { location, matches, status } = router.state;
        const isPrivateRoute = matches.some((match) =>
          match.routeId.startsWith(PRIVATE_LAYOUT_ROUTE_ID),
        );
        if (isPrivateRoute && status === 'idle') {
          void router.navigate({
            to: '/login',
            search: { redirect: location.href, reason: 'expired' },
            replace: true,
          });
        }
      }),
    [queryClient, router],
  );

  return null;
}
