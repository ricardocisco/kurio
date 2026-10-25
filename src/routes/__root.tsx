import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { SiteLayout } from '@/app/layout/SiteLayout';
import type { RouterContext } from '@/app/router';
import { SessionWatcher } from '@/features/auth/components/SessionWatcher';

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools/Devtools')) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [{ title: 'Kurio · Marketplace de NFTs' }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <SessionWatcher />
      <SiteLayout>
        <Outlet />
      </SiteLayout>
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  );
}
