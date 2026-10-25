import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  TagIcon,
  TriangleAlertIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { useLogout } from '@/features/auth/hooks/use-auth-actions';
import { useSession } from '@/features/auth/hooks/use-session';
import { useComingSoon } from '@/shared/hooks/use-coming-soon';
import { cn } from '@/shared/lib/cn';

interface AccountNavItem {
  label: string;
  icon: LucideIcon;
  to?: '/account/profile' | '/account/wallets' | '/account/favorites';
}

const NAV_ITEMS: AccountNavItem[] = [
  { label: 'Dados do perfil', icon: UserIcon, to: '/account/profile' },
  { label: 'Carteiras', icon: MapPinIcon, to: '/account/wallets' },
  { label: 'Atividade', icon: ShoppingCartIcon },
  { label: 'Lista de interesse', icon: HeartIcon, to: '/account/favorites' },
  { label: 'Ofertas', icon: TagIcon },
  { label: 'Arquivos baixados', icon: DownloadIcon },
  { label: 'Suporte', icon: TriangleAlertIcon },
];

const itemClass =
  'flex w-full shrink-0 items-center gap-3 border-l-4 border-transparent px-4 py-2.5 text-left text-xs text-primary transition-colors hover:bg-accent md:px-3';

export function AccountLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { user } = useSession();
  const logoutMutation = useLogout();
  const showComingSoon = useComingSoon();

  const handleLogout = () =>
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.info('Você saiu da sua conta.');
        void navigate({ to: '/' });
      },
    });

  return (
    <div className="container-content grid grid-cols-1 gap-6 py-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6 lg:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)] lg:gap-6">
      <aside className="flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3 rounded-sm bg-card px-4 py-3">
            <UserAvatar user={user} className="size-10 text-sm" />
            <p className="min-w-0 text-xs">
              <span className="block truncate">
                Conectado como <strong>{user.displayName}</strong>
              </span>
              <span className="block truncate text-muted-foreground">{user.email}</span>
            </p>
          </div>
        )}
        <nav aria-label="Minha conta" className="bg-card py-3">
          <h2 className="px-4 pb-2 text-base font-bold md:px-3">Meu perfil</h2>
          <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0 md:overflow-visible">
            {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
              const isActive = to === pathname;
              return (
                <li key={label} className="shrink-0 md:shrink">
                  {to ? (
                    <Link
                      to={to}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(itemClass, isActive && 'border-primary bg-accent/50 font-bold')}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={itemClass}
                      onClick={() => showComingSoon(label)}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
            <li className="shrink-0 md:mt-1 md:border-t md:border-primary/50 md:pt-1">
              <button
                type="button"
                className={cn(itemClass, 'font-bold')}
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOutIcon className="size-4" aria-hidden="true" />
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
