import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'relative isolate overflow-hidden rounded-md bg-accent',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        'before:bg-linear-to-r before:from-transparent before:via-white/8 before:to-transparent',
        'motion-reduce:before:hidden',
        className,
      )}
      {...props}
    />
  );
}
