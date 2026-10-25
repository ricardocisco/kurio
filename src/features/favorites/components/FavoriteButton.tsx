import { useRouterState, useNavigate } from '@tanstack/react-router';
import { HeartIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/features/auth/hooks/use-session';
import type { NftSummary } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { useFavorites, useToggleFavorite } from '../hooks/use-favorites';

interface FavoriteButtonProps {
  nft: NftSummary;
  variant: 'button' | 'icon' | 'overlay';
  className?: string;
}

export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const navigate = useNavigate();
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const { isResolving } = useSession();
  const { userId, favoriteIds } = useFavorites();
  const toggle = useToggleFavorite(userId ?? 'guest');
  const isFavorite = favoriteIds.has(nft.id);

  const handleClick = () => {
    if (!userId) {
      toast.info('Entre na sua conta para salvar favoritos.');
      void navigate({ to: '/login', search: { redirect: currentHref } });
      return;
    }
    toggle.mutate({ nft, shouldFavorite: !isFavorite });
  };

  const heart = (
    <HeartIcon
      aria-hidden="true"
      className={cn('transition-colors', isFavorite && 'fill-primary text-primary')}
    />
  );

  if (variant === 'button') {
    return (
      <Button
        type="button"
        variant="outline"
        aria-pressed={isFavorite}
        disabled={isResolving}
        onClick={handleClick}
        className={className}
      >
        {heart}
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={`Favoritar ${nft.name}`}
      disabled={isResolving}
      onClick={handleClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-full text-primary transition-colors disabled:opacity-60 [&_svg]:size-5',
        variant === 'icon' && 'bg-card hover:bg-accent',
        variant === 'overlay' && 'bg-background/80 backdrop-blur hover:bg-background',
        className,
      )}
    >
      {heart}
    </button>
  );
}
