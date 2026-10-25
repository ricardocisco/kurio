import { ShoppingCartIcon } from 'lucide-react';

import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import type { NftSummary } from '@/shared/contracts/nft';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export const PURCHASE_UNAVAILABLE_NOTE = 'A compra será liberada junto com o carrinho.';

export function DesktopPurchaseActions({ noteId, nft }: { noteId: string; nft: NftSummary }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="min-w-32 uppercase" disabled aria-describedby={noteId}>
        Comprar
      </Button>
      <FavoriteButton nft={nft} variant="button" />
    </div>
  );
}

export function MobilePurchaseActions({
  noteId,
  className,
}: {
  noteId: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button variant="gradient" size="pill" className="flex-1" disabled aria-describedby={noteId}>
        Comprar NFT
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="size-14 rounded-full text-primary"
        disabled
        aria-label="Adicionar ao carrinho"
        aria-describedby={noteId}
      >
        <ShoppingCartIcon className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
