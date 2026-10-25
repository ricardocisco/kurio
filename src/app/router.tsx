import { type QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { RouteErrorFallback } from '@/shared/components/RouteErrorFallback';
import { NotFoundPage } from '@/shared/components/NotFoundPage';

/** Dependencies available to every route `beforeLoad` / `loader` via `context`. */
export interface RouterContext {
  queryClient: QueryClient;
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    // Data freshness is owned by TanStack Query, so the router never caches loader results.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultNotFoundComponent: () => <NotFoundPage />,
    defaultErrorComponent: RouteErrorFallback,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
