import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  PASSWORD_MIN_LENGTH,
  registerInputSchema,
  type RegisterInput,
  type SessionUser,
} from '@/shared/contracts/session';
import { Button } from '@/shared/ui/button';

import { useRegister } from '../hooks/use-auth-actions';
import { applyServerErrors } from '../model/apply-server-errors';

import { AuthField } from './AuthField';
import { FormAlert } from './FormAlert';

const REGISTER_FIELDS = ['username', 'email', 'password', 'confirmPassword'] as const;

export function RegisterForm({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const registerMutation = useRegister();
  const [formError, setFormError] = useState<string>();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });
  const { errors } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    registerMutation.mutate(values, {
      onSuccess: (result) => onSuccess(result.user),
      onError: (error) => setFormError(applyServerErrors(error, REGISTER_FIELDS, form.setError)),
    });
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      aria-label="Criar conta"
    >
      <FormAlert message={formError} />
      <AuthField
        label="Nome de usuário"
        autoComplete="username"
        autoCapitalize="none"
        error={errors.username?.message}
        hint="Letras minúsculas, números, ponto ou sublinhado."
        {...form.register('username')}
      />
      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <AuthField
        label="Senha"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`}
        {...form.register('password')}
      />
      <AuthField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button
        type="submit"
        size="lg"
        className="w-full md:h-10"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  );
}
