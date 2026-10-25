import { QuantityStepper } from '@/shared/components/QuantityStepper';
import type { NftDetail, NftEdition } from '@/shared/contracts/nft';
import { formatEth, multiplyEth } from '@/shared/lib/money';

import { describeQuantityLimit, getQuantityLimit, isEditionAvailable } from '../model/edition';

import { MobilePurchaseActions } from './PurchaseActions';

interface MobilePurchaseBarProps {
  nft: NftDetail;
  edition: NftEdition;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  noteId: string;
}

export function MobilePurchaseBar({
  nft,
  edition,
  quantity,
  onQuantityChange,
  noteId,
}: MobilePurchaseBarProps) {
  const limit = getQuantityLimit(edition);
  const isAvailable = isEditionAvailable(edition);
  const total = multiplyEth(edition.price, quantity);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-card px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.35)] md:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" aria-hidden="true">
            Qtd.
          </span>
          <QuantityStepper
            label={`Quantidade de ${nft.name}`}
            value={quantity}
            max={Math.max(1, limit.max)}
            onChange={onQuantityChange}
            disabled={!isAvailable}
            size="sm"
          />
        </div>
        <p className="text-lg font-bold text-primary">
          <span className="sr-only">Total: </span>
          {formatEth(total)}
        </p>
      </div>
      {isAvailable && quantity >= limit.max && (
        <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
          {describeQuantityLimit(limit)}
        </p>
      )}
      <MobilePurchaseActions noteId={noteId} />
    </div>
  );
}
