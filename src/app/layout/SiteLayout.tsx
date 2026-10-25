import type * as React from 'react';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <AppFooter />
      <MobileTabBar />
    </div>
  );
}
