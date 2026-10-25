import { useId, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string | undefined;
  hint?: string;
  className?: string;
  children: (field: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function FormField({ label, required, error, hint, className, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="ml-1 text-muted-foreground">(opcional)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[0.6875rem] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldInputClass =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive read-only:cursor-default read-only:text-text-secondary';
