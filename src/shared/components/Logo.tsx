import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/cn';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'lg';
}

export function Logo({ className, size = 'sm' }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn(
        'font-bold tracking-[0.2em] text-foreground uppercase transition-colors hover:text-primary',
        size === 'sm' ? 'text-xs' : 'text-3xl',
        className,
      )}
      aria-label="Kurio, página inicial"
    >
      Kurio
    </Link>
  );
}
