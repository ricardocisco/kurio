import { Link, useRouterState } from '@tanstack/react-router';
import { HeartIcon, HouseIcon, ScanLineIcon, ShoppingCartIcon, UserIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

const tabClass =
  'flex size-12 flex-col items-center justify-center rounded-full text-text-secondary transition-colors hover:text-primary aria-[current=page]:text-primary';

export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.35)] md:hidden"
    >
      <ul className="relative mx-auto flex h-16 max-w-md items-center justify-around px-4">
        <li>
          <Link to="/" className={tabClass} aria-current={pathname === '/' ? 'page' : undefined}>
            <HouseIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">Início</span>
          </Link>
        </li>
        <li>
          <Link
            to="/account/favorites"
            className={tabClass}
            aria-current={pathname === '/account/favorites' ? 'page' : undefined}
          >
            <HeartIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">Lista de interesse</span>
          </Link>
        </li>
        <li className="-mt-10">
          <Link
            to="/marketplace"
            className={cn(
              'flex size-16 items-center justify-center rounded-full bg-primary-gradient text-primary-foreground shadow-lg ring-8 ring-background',
              'focus-visible:outline-offset-4',
            )}
            aria-current={pathname === '/marketplace' ? 'page' : undefined}
          >
            <ScanLineIcon className="size-7" aria-hidden="true" />
            <span className="sr-only">Explorar mercado</span>
          </Link>
        </li>
        <li>
          <Link
            to="/cart"
            className={tabClass}
            aria-current={pathname === '/cart' ? 'page' : undefined}
          >
            <ShoppingCartIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">Carrinho</span>
          </Link>
        </li>
        <li>
          <Link
            to="/account/profile"
            className={tabClass}
            aria-current={
              pathname.startsWith('/account') && pathname !== '/account/favorites'
                ? 'page'
                : undefined
            }
          >
            <UserIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">Minha conta</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
