import type { UseFormReturn } from 'react-hook-form';

import type { CheckoutFormOutput, CheckoutFormValues } from '@/shared/contracts/checkout';
import { cn } from '@/shared/lib/cn';

import { fieldInputClass, FormField } from '@/shared/components/FormField';

interface CollectorFieldsProps {
  form: UseFormReturn<CheckoutFormValues, unknown, CheckoutFormOutput>;
}

export function CollectorFields({ form }: CollectorFieldsProps) {
  const { errors } = form.formState;

  return (
    <fieldset className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <legend className="mb-4 text-sm font-bold lg:text-lg">Perfil do colecionador</legend>
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
      <FormField label="Código de indicação" error={errors.referralCode?.message}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            autoCapitalize="characters"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={fieldInputClass}
            {...form.register('referralCode')}
          />
        )}
      </FormField>
      <FormField
        label="Observação do colecionador"
        error={errors.note?.message}
        className="sm:col-span-2"
      >
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            rows={4}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(fieldInputClass, 'h-auto max-w-md py-2')}
            {...form.register('note')}
          />
        )}
      </FormField>
    </fieldset>
  );
}
