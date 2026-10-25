import { type QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { RouteErrorFallback } from '@/shared/components/RouteErrorFallback';
import { NotFoundPage } from '@/shared/components/NotFoundPage';

export interface RouterContext {
  queryClient: QueryClient;
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
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

  interface StaticDataRouteOption {
    mobileNavigation?: 'tab-bar' | 'page-bar' | 'none';
    hideFooterOnMobile?: boolean;
  }
}
