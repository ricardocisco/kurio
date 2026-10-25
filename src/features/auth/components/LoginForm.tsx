import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { loginInputSchema, type LoginInput, type SessionUser } from '@/shared/contracts/session';
import { useComingSoon } from '@/shared/hooks/use-coming-soon';
import { Button } from '@/shared/ui/button';

import { useLogin } from '../hooks/use-auth-actions';
import { applyServerErrors } from '@/shared/forms/apply-server-errors';

import { AuthField } from './AuthField';
import { FormAlert } from './FormAlert';

const LOGIN_FIELDS = ['email', 'password'] as const;

export function LoginForm({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const showComingSoon = useComingSoon();
  const loginMutation = useLogin();
  const [formError, setFormError] = useState<string>();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    loginMutation.mutate(values, {
      onSuccess: (result) => onSuccess(result.user),
      onError: (error) => setFormError(applyServerErrors(error, LOGIN_FIELDS, form.setError)),
    });
  });

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="Entrar">
      <FormAlert message={formError} />
      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <div className="flex flex-col gap-2">
        <AuthField
          label="Senha"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <button
          type="button"
          onClick={() => showComingSoon('A recuperação de senha')}
          className="self-end text-xs text-primary hover:underline"
        >
          Esqueceu a senha?
        </button>
      </div>
      <Button type="submit" size="lg" className="w-full md:h-10" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
