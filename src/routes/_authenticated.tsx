import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { sessionQueryOptions } from '@/features/auth/api/session.queries';
import { consumeSessionExpired } from '@/features/auth/model/session-token';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery({
      ...sessionQueryOptions(),
      staleTime: 0,
    });
    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
          reason: consumeSessionExpired() ? 'expired' : undefined,
        },
        replace: true,
      });
    }
    return { sessionUser: session.user };
  },
  component: Outlet,
});
