import { HeartIcon, ShoppingCartIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/**
 * Purchase and favorite actions. They stay disabled until the cart (phase 2.5) and favorites
 * (phase 2.4) are connected to the API, so the page never pretends an action succeeded.
 */
export const PURCHASE_UNAVAILABLE_NOTE =
  'Compra e favoritos serão liberados nas próximas etapas do projeto.';

export function DesktopPurchaseActions({ noteId }: { noteId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="min-w-32 uppercase" disabled aria-describedby={noteId}>
        Comprar
      </Button>
      <Button variant="outline" disabled aria-describedby={noteId}>
        <HeartIcon aria-hidden="true" />
        Favoritar
      </Button>
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
