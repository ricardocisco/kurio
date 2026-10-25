import { Link, useNavigate } from '@tanstack/react-router';
import { LogOutIcon, UserIcon, WalletIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { SessionUser } from '@/shared/contracts/session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { useLogout } from '../hooks/use-auth-actions';

import { UserAvatar } from './UserAvatar';

export function UserMenu({ user }: { user: SessionUser }) {
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.info('Você saiu da sua conta.');
        void navigate({ to: '/' });
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="ml-2 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent"
        aria-label={`Menu da conta de ${user.displayName}`}
      >
        <UserAvatar user={user} className="size-7" />
        <span className="max-w-32 truncate">{user.displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account/profile">
            <UserIcon aria-hidden="true" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/wallets">
            <WalletIcon aria-hidden="true" />
            Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} disabled={logoutMutation.isPending}>
          <LogOutIcon aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
