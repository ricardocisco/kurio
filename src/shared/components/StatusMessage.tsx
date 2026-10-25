import { RefreshCwIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

interface StatusMessageProps {
  variant: 'empty' | 'error';
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Shared visual for empty and error states. Errors use `role="alert"` to be announced. */
export function StatusMessage({
  variant,
  title,
  description,
  action,
  className,
}: StatusMessageProps) {
  const Icon = variant === 'error' ? TriangleAlertIcon : SearchXIcon;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg bg-card px-6 py-12 text-center',
        className,
      )}
    >
      <Icon className="size-10 text-primary" aria-hidden="true" />
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function RetryButton({ onRetry, isRetrying = false }: RetryButtonProps) {
  return (
    <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
      <RefreshCwIcon className={cn(isRetrying && 'animate-spin')} aria-hidden="true" />
      {isRetrying ? 'Tentando novamente…' : 'Tentar novamente'}
    </Button>
  );
}
