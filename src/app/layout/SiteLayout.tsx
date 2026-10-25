import { useMatches } from '@tanstack/react-router';
import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { mobileNavigation, hideFooterOnMobile } = useMatches({
    select: (matches) => ({
      mobileNavigation:
        matches.findLast((match) => match.staticData.mobileNavigation)?.staticData
          .mobileNavigation ?? 'tab-bar',
      hideFooterOnMobile: matches.some((match) => match.staticData.hideFooterOnMobile),
    }),
  });
  const hasPageBar = mobileNavigation === 'page-bar';

  return (
    <div className={cn('flex min-h-dvh flex-col overflow-x-clip', hasPageBar && 'max-md:pb-40')}>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <AppHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100dvh-var(--spacing-header))] flex-1 outline-none"
      >
        {children}
      </main>
      <div className={cn(hideFooterOnMobile && 'max-md:hidden')}>
        <AppFooter />
      </div>
      {mobileNavigation === 'tab-bar' && <MobileTabBar />}
    </div>
  );
}
