import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground transition-colors outline-none',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/80',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
        className,
      )}
      {...props}
    />
  );
}
