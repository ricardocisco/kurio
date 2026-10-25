import { Link, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { SessionUser } from '@/shared/contracts/session';
import { cn } from '@/shared/lib/cn';

import type { AuthSearch } from '../model/auth-search';
import { sanitizeRedirect } from '../model/redirect';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { SocialLoginButtons } from './SocialLoginButtons';

export type AuthMode = 'login' | 'register';

interface AuthPanelProps {
  mode: AuthMode;
  search: AuthSearch;
  variant: 'dialog' | 'page';
}

const COPY = {
  login: {
    title: 'Entrar',
    pageTitle: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    pageTitle: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
} as const;

export function AuthPanel({ mode, search, variant }: AuthPanelProps) {
  const router = useRouter();
  const copy = COPY[mode];
  const linkSearch = { redirect: search.redirect };

  const handleSuccess = (user: SessionUser) => {
    toast.success(`Bem-vindo, ${user.displayName}!`);
    void router.navigate({ href: sanitizeRedirect(search.redirect), replace: true });
  };

  const tabClass = (isActive: boolean) =>
    cn('transition-colors hover:text-primary', isActive ? 'text-primary' : 'text-foreground');

  return (
    <div className="flex flex-col gap-5">
      {variant === 'dialog' ? (
        <nav
          aria-label="Acesso à conta"
          className="flex items-center justify-center gap-2 text-base"
        >
          <Link
            to="/login"
            search={linkSearch}
            replace
            className={tabClass(mode === 'login')}
            aria-current={mode === 'login' ? 'page' : undefined}
          >
            Entrar
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-primary" />
          <Link
            to="/register"
            search={linkSearch}
            replace
            className={tabClass(mode === 'register')}
            aria-current={mode === 'register' ? 'page' : undefined}
          >
            Criar conta
          </Link>
        </nav>
      ) : (
        <h1 className="text-center text-lg font-bold">{copy.pageTitle}</h1>
      )}

      <p className={cn('text-center text-xs text-text-secondary', variant === 'page' && 'sr-only')}>
        {copy.description}
      </p>

      {search.reason === 'expired' && (
        <p
          role="status"
          className="rounded-md border border-warning/60 px-3 py-2 text-center text-xs text-warning"
        >
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}

      {mode === 'login' ? (
        <LoginForm onSuccess={handleSuccess} />
      ) : (
        <RegisterForm onSuccess={handleSuccess} />
      )}

      <SocialLoginButtons />

      {variant === 'page' && (
        <p className="pt-4 text-center text-sm text-text-secondary">
          {mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
          <Link
            to={mode === 'login' ? '/register' : '/login'}
            search={linkSearch}
            replace
            className="text-text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            {mode === 'login' ? 'Crie uma conta' : 'Entre'}
          </Link>
        </p>
      )}
    </div>
  );
}

export const AUTH_COPY = COPY;
