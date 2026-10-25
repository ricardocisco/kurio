import { useNavigate } from '@tanstack/react-router';
import { ShoppingCartIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useAddToCart } from '@/features/cart/hooks/use-cart';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { isApiError } from '@/shared/api/api-error';
import type { NftDetail, NftEdition } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { isEditionAvailable } from '../model/edition';

interface PurchaseActionsProps {
  nft: NftDetail;
  edition: NftEdition;
  quantity: number;
  className?: string;
}

function usePurchase({ nft, edition, quantity }: PurchaseActionsProps) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const isAvailable = isEditionAvailable(edition);

  const add = (goToCart: boolean) => {
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity, name: nft.name },
      {
        onSuccess: () => {
          if (goToCart) {
            void navigate({ to: '/cart' });
            return;
          }
          toast.success(`${nft.name} (${edition.label}) adicionado ao carrinho.`, {
            action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/cart' }) },
          });
        },
        onError: (error) => {
          toast.error(
            isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.',
          );
        },
      },
    );
  };

  return { add, isPending: addToCart.isPending, isAvailable };
}

export function DesktopPurchaseActions(props: PurchaseActionsProps) {
  const { add, isPending, isAvailable } = usePurchase(props);
  return (
    <div className={cn('flex flex-wrap gap-3', props.className)}>
      <Button
        className="min-w-32 uppercase"
        disabled={!isAvailable || isPending}
        onClick={() => add(true)}
      >
        {isAvailable ? (isPending ? 'Adicionando…' : 'Comprar') : 'Esgotado'}
      </Button>
      <FavoriteButton nft={props.nft} variant="button" />
    </div>
  );
}

export function MobilePurchaseActions(props: PurchaseActionsProps) {
  const { add, isPending, isAvailable } = usePurchase(props);
  return (
    <div className={cn('flex items-center gap-3', props.className)}>
      <Button
        variant="gradient"
        size="pill"
        className="flex-1"
        disabled={!isAvailable || isPending}
        onClick={() => add(true)}
      >
        {isAvailable ? (isPending ? 'Adicionando…' : 'Comprar NFT') : 'Esgotado'}
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="size-14 rounded-full text-primary"
        disabled={!isAvailable || isPending}
        aria-label="Adicionar ao carrinho"
        onClick={() => add(false)}
      >
        <ShoppingCartIcon className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
