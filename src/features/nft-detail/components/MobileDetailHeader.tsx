import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';

import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import type { NftSummary } from '@/shared/contracts/nft';

export function MobileDetailHeader({ nft }: { nft: NftSummary }) {
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
      <FavoriteButton nft={nft} variant="icon" />
    </div>
  );
}
