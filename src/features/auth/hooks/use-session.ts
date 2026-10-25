import { useQuery } from '@tanstack/react-query';

import { sessionQueryOptions } from '../api/session.queries';

export function useSession() {
  const session = useQuery(sessionQueryOptions());
  return {
    user: session.data?.user ?? null,
    isAuthenticated: Boolean(session.data),
    isResolving: session.isPending,
  };
}
