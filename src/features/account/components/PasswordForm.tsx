import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { fieldInputClass, FormField } from '@/shared/components/FormField';
import { PasswordInput } from '@/shared/components/PasswordInput';
import {
  changePasswordInputSchema,
  PASSWORD_HINT,
  type ChangePasswordInput,
} from '@/shared/contracts/profile';
import { applyServerErrors } from '@/shared/forms/apply-server-errors';
import { Button } from '@/shared/ui/button';

import { useChangePassword } from '../hooks/use-profile';

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;
const LABELS = {
  currentPassword: 'Senha atual',
  newPassword: 'Nova senha',
  confirmPassword: 'Confirmar nova senha',
} as const;

export function PasswordForm() {
  const change = useChangePassword();
  const [formError, setFormError] = useState<string>();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordInputSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const { errors } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    change.mutate(values, {
      onSuccess: () => {
        form.reset();
        toast.success('Senha alterada. Use a nova senha no próximo login.');
      },
      onError: (error) => setFormError(applyServerErrors(error, PASSWORD_FIELDS, form.setError)),
    });
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="password-title"
      className="flex max-w-md flex-col gap-5"
    >
      <h2 id="password-title" className="text-sm font-bold lg:text-base">
        Alterar senha
      </h2>
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/60 px-3 py-2 text-xs text-destructive"
        >
          {formError}
        </p>
      )}
      {PASSWORD_FIELDS.map((field) => (
        <FormField
          key={field}
          label={LABELS[field]}
          required
          error={errors[field]?.message}
          hint={field === 'newPassword' ? PASSWORD_HINT : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              label={LABELS[field]}
              autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={fieldInputClass}
              {...form.register(field)}
            />
          )}
        </FormField>
      ))}
      <Button type="submit" className="w-fit" disabled={change.isPending}>
        {change.isPending ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  );
}
