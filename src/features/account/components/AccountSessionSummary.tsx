import { useNavigate } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { useLogout } from '@/features/auth/hooks/use-auth-actions';
import { useSession } from '@/features/auth/hooks/use-session';
import { Button } from '@/shared/ui/button';

export function AccountSessionSummary() {
  const { user } = useSession();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-md border border-border px-4 py-3">
      <UserAvatar user={user} />
      <p className="text-sm">
        Conectado como <strong>{user.displayName}</strong>
        <span className="block text-xs text-muted-foreground">{user.email}</span>
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={logoutMutation.isPending}
        onClick={() =>
          logoutMutation.mutate(undefined, {
            onSuccess: () => {
              toast.info('Você saiu da sua conta.');
              void navigate({ to: '/' });
            },
          })
        }
      >
        <LogOutIcon aria-hidden="true" />
        Sair
      </Button>
    </div>
  );
}
