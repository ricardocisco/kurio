import { MinusIcon, PlusIcon } from 'lucide-react';
import { useId } from 'react';

import { cn } from '@/shared/lib/cn';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  limitMessage?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  limitMessage,
  disabled = false,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const messageId = useId();
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;
  const buttonClass = cn(
    'flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-strong',
    'disabled:cursor-not-allowed disabled:bg-primary/30 disabled:text-primary-foreground/60',
    size === 'md' ? 'size-7' : 'size-6',
  );

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        role="group"
        aria-label={label}
        aria-describedby={limitMessage ? messageId : undefined}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={!canDecrease}
          aria-label="Diminuir quantidade"
        >
          <MinusIcon className="size-4" strokeWidth={3} aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="min-w-6 text-center text-base font-medium tabular-nums"
        >
          {value}
        </output>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={!canIncrease}
          aria-label="Aumentar quantidade"
        >
          <PlusIcon className="size-4" strokeWidth={3} aria-hidden="true" />
        </button>
      </div>
      {limitMessage && (
        <p id={messageId} className="text-xs text-muted-foreground" aria-live="polite">
          {limitMessage}
        </p>
      )}
    </div>
  );
}
