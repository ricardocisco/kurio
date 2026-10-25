import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

interface PasswordInputProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string;
}

export function PasswordInput({ label, className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="relative">
      <input type={isVisible ? 'text' : 'password'} className={cn(className, 'pr-11')} {...props} />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={isVisible}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-primary transition-colors hover:text-primary-strong"
      >
        {isVisible ? (
          <EyeIcon className="size-4" aria-hidden="true" />
        ) : (
          <EyeOffIcon className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
