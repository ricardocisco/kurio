import { Link, useRouterState } from '@tanstack/react-router';
import { LogInIcon } from 'lucide-react';

import { UserMenu } from '@/features/auth/components/UserMenu';
import { CartLink } from '@/features/cart/components/CartLink';
import { useSession } from '@/features/auth/hooks/use-session';
import { Logo } from '@/shared/components/Logo';
import { useComingSoon } from '@/shared/hooks/use-coming-soon';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { HeaderSearch } from './HeaderSearch';
import { isNavigationItemActive, PRIMARY_NAVIGATION } from './navigation';

const navItemClass =
  'relative inline-flex h-header items-center px-1 text-sm text-text-secondary lg:text-base transition-colors hover:text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent';
const navItemActiveClass = 'font-medium text-primary after:bg-primary';

export function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const { user, isResolving } = useSession();
  const showComingSoon = useComingSoon();

  return (
    <header className="sticky top-0 z-40 hidden bg-background/95 backdrop-blur md:block">
      <div className="container-content flex h-header items-center justify-between border-b border-primary/50">
        <Logo className="lg:mt-3.5" />

        <nav aria-label="Principal" className="lg:ml-auto">
          <ul className="flex items-center gap-6 lg:gap-10">
            {PRIMARY_NAVIGATION.map((item) => {
              const isActive = isNavigationItemActive(item, pathname);
              return (
                <li key={item.label}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className={cn(navItemClass, isActive && navItemActiveClass)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={navItemClass}
                      onClick={() => showComingSoon(item.label)}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 lg:mt-3.5 lg:ml-[12.75rem] lg:gap-2.5">
          <HeaderSearch />
          <CartLink
            isCurrent={pathname === '/cart'}
            iconClassName="lg:size-6"
            className="flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
          />
          {isResolving ? (
            <span className="ml-2 h-8 w-24" aria-hidden="true" />
          ) : user ? (
            <UserMenu user={user} />
          ) : (
            <Button
              asChild
              size="sm"
              className="ml-2 h-[2.125rem] gap-1.5 px-2.5 text-sm font-medium lg:ml-3 lg:text-base [&_svg:not([class*='size-'])]:size-5"
            >
              <Link
                to="/login"
                search={{
                  redirect:
                    pathname === '/login' || pathname === '/register' ? undefined : currentHref,
                }}
              >
                <LogInIcon aria-hidden="true" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
