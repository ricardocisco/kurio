import { zodResolver } from '@hookform/resolvers/zod';
import { TagIcon, XIcon } from 'lucide-react';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';
import {
  applyCouponInputSchema,
  type ApplyCouponInput,
  type AppliedCoupon,
} from '@/shared/contracts/cart';
import { cn } from '@/shared/lib/cn';

import { useApplyCoupon, useRemoveCoupon } from '../hooks/use-cart';

interface CouponFormProps {
  coupon: AppliedCoupon | null;
  variant: 'panel' | 'pill';
  disabled?: boolean;
}

export function CouponForm({ coupon, variant, disabled = false }: CouponFormProps) {
  const inputId = useId();
  const errorId = useId();
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();
  const form = useForm<ApplyCouponInput>({
    resolver: zodResolver(applyCouponInputSchema),
    defaultValues: { code: '' },
  });
  const error = form.formState.errors.code?.message;

  if (coupon) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/60 px-3 py-2 text-xs">
        <span className="flex items-center gap-2 text-text-secondary">
          <TagIcon className="size-4 text-primary" aria-hidden="true" />
          <span>
            <strong className="text-foreground">{coupon.code}</strong> · {coupon.description}
          </span>
        </span>
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="flex items-center gap-1 font-bold text-primary hover:underline disabled:opacity-60"
        >
          <XIcon className="size-3" aria-hidden="true" />
          Remover cupom
        </button>
      </div>
    );
  }

  const handleSubmit = form.handleSubmit((values) => {
    apply.mutate(values, {
      onSuccess: () => form.reset(),
      onError: (mutationError) => {
        const message = isApiError(mutationError)
          ? (mutationError.fieldErrors.code?.[0] ?? mutationError.message)
          : 'Não foi possível aplicar o cupom.';
        form.setError('code', { type: 'server', message }, { shouldFocus: true });
      },
    });
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-1.5"
      aria-label="Cupom de desconto"
    >
      <label htmlFor={inputId} className={cn('text-xs font-bold', variant === 'pill' && 'sr-only')}>
        Código promocional
      </label>
      <div className={cn('flex', variant === 'pill' && 'rounded-full bg-background p-1')}>
        <input
          id={inputId}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          autoCapitalize="characters"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-9 min-w-0 flex-1 bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none aria-invalid:text-destructive',
            variant === 'panel' &&
              'rounded-l-md border border-r-0 border-input focus-visible:border-primary',
            variant === 'pill' && 'h-11 px-4',
          )}
          {...form.register('code')}
        />
        <button
          type="submit"
          disabled={disabled || apply.isPending}
          className={cn(
            'bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-strong disabled:opacity-60',
            variant === 'panel' && 'h-9 rounded-r-md',
            variant === 'pill' && 'h-11 rounded-full bg-primary-gradient px-5 text-sm',
          )}
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
