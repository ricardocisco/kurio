import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';
import {
  newsletterSubscriptionInputSchema,
  type NewsletterSubscriptionInput,
} from '@/shared/contracts/newsletter';
import { cn } from '@/shared/lib/cn';

import { subscribeToNewsletter } from '../api/newsletter.api';

export function NewsletterForm() {
  const inputId = useId();
  const messageId = useId();
  const form = useForm<NewsletterSubscriptionInput>({
    resolver: zodResolver(newsletterSubscriptionInputSchema),
    defaultValues: { email: '' },
  });

  const subscription = useMutation({
    mutationFn: subscribeToNewsletter,
    onSuccess: () => form.reset(),
    onError: (error) => {
      const message = isApiError(error) ? error.fieldErrors.email?.[0] : undefined;
      if (message) form.setError('email', { message });
    },
  });

  const fieldError = form.formState.errors.email?.message;
  const requestError =
    subscription.isError && !fieldError
      ? isApiError(subscription.error)
        ? subscription.error.message
        : 'Não foi possível concluir a inscrição.'
      : undefined;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => subscription.mutate(values))}
      className="flex flex-col gap-3"
    >
      <label htmlFor={inputId} className="sr-only">
        E-mail para alertas de lançamento
      </label>
      <div className="flex">
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            'h-10 min-w-0 flex-1 rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm placeholder:text-muted-foreground/80',
            'focus-visible:border-primary focus-visible:outline-none aria-invalid:border-destructive',
          )}
          {...form.register('email')}
        />
        <button
          type="submit"
          disabled={subscription.isPending}
          className="h-10 rounded-r-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong disabled:opacity-60"
        >
          {subscription.isPending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
      <p id={messageId} aria-live="polite" className="min-h-4 text-xs">
        {fieldError && <span className="text-destructive">{fieldError}</span>}
        {requestError && <span className="text-destructive">{requestError}</span>}
        {subscription.isSuccess && (
          <span className="text-success">Inscrição confirmada para {subscription.data.email}.</span>
        )}
      </p>
    </form>
  );
}
