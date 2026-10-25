import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { fieldInputClass, FormField } from '@/shared/components/FormField';
import {
  updateProfileInputSchema,
  type Profile,
  type UpdateProfileInput,
} from '@/shared/contracts/profile';
import { applyServerErrors } from '@/shared/forms/apply-server-errors';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { useUpdateProfile } from '../hooks/use-profile';

import { AvatarField } from './AvatarField';

const PROFILE_FIELDS = ['displayName', 'username', 'email', 'ensName'] as const;

export function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile(profile.id);
  const [formError, setFormError] = useState<string>();
  const form = useForm<UpdateProfileInput, unknown, UpdateProfileInput>({
    resolver: zodResolver(updateProfileInputSchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName ?? '',
    },
  });
  const { errors } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    update.mutate(values, {
      onSuccess: (saved) => {
        form.reset({
          displayName: saved.displayName,
          username: saved.username,
          email: saved.email,
          ensName: saved.ensName ?? '',
        });
        toast.success('Dados do perfil salvos.');
      },
      onError: (error) => setFormError(applyServerErrors(error, PROFILE_FIELDS, form.setError)),
    });
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="profile-title"
      className="flex flex-col gap-5"
    >
      <h2 id="profile-title" className="text-sm font-bold lg:text-base">
        Perfil do colecionador
      </h2>
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/60 px-3 py-2 text-xs text-destructive"
        >
          {formError}
        </p>
      )}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <FormField label="Nome de exibição" required error={errors.displayName?.message}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              autoComplete="nickname"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={fieldInputClass}
              {...form.register('displayName')}
            />
          )}
        </FormField>
        <FormField label="Nome de usuário" required error={errors.username?.message}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              autoComplete="username"
              autoCapitalize="none"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={fieldInputClass}
              {...form.register('username')}
            />
          )}
        </FormField>
        <FormField label="E-mail" required error={errors.email?.message}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="email"
              autoComplete="email"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={fieldInputClass}
              {...form.register('email')}
            />
          )}
        </FormField>
        <FormField label="Nome ENS" error={errors.ensName?.message}>
          {({ id, describedBy, invalid }) => (
            <div className="flex">
              <input
                id={id}
                placeholder="seunome"
                autoCapitalize="none"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={cn(fieldInputClass, 'rounded-r-none')}
                {...form.register('ensName')}
              />
              <span className="flex h-10 items-center rounded-r-md border border-l-0 border-input px-3 text-xs text-text-secondary">
                .eth
              </span>
            </div>
          )}
        </FormField>
        <AvatarField profile={profile} />
      </div>
      <Button
        type="submit"
        className="w-fit"
        disabled={update.isPending || !form.formState.isDirty}
      >
        {update.isPending ? 'Salvando…' : 'Salvar dados'}
      </Button>
    </form>
  );
}
