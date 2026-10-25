import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeftIcon, HeartIcon } from 'lucide-react';

import { PURCHASE_UNAVAILABLE_NOTE } from './PurchaseActions';

export function MobileDetailHeader() {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const handleBack = () => {
    if (canGoBack) router.history.back();
    else void navigate({ to: '/marketplace' });
  };

  return (
    <div className="container-content flex items-center justify-between pt-4 md:hidden">
      <button
        type="button"
        onClick={handleBack}
        className="flex size-9 items-center justify-center rounded-full bg-card text-primary transition-colors hover:bg-accent"
        aria-label="Voltar"
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled
        title={PURCHASE_UNAVAILABLE_NOTE}
        className="flex size-9 items-center justify-center rounded-full bg-card text-primary disabled:opacity-60"
        aria-label="Favoritar (em breve)"
      >
        <HeartIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
