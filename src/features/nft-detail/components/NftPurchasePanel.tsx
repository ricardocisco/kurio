import { useId } from 'react';

import { RatingStars } from '@/features/nfts/components/RatingStars';
import { EthPrice } from '@/shared/components/EthPrice';
import { QuantityStepper } from '@/shared/components/QuantityStepper';
import type { NftDetail, NftEdition } from '@/shared/contracts/nft';

import { describeQuantityLimit, getQuantityLimit, isEditionAvailable } from '../model/edition';

import { EditionSelector } from './EditionSelector';
import { NftShareLinks } from './NftShareLinks';
import { DesktopPurchaseActions } from './PurchaseActions';

interface NftPurchasePanelProps {
  nft: NftDetail;
  edition: NftEdition;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onEditionChange: (editionId: string) => void;
  shareUrl: string;
}

export function NftPurchasePanel({
  nft,
  edition,
  quantity,
  onQuantityChange,
  onEditionChange,
  shareUrl,
}: NftPurchasePanelProps) {
  const aboutId = useId();
  const limit = getQuantityLimit(edition);
  const isAvailable = isEditionAvailable(edition);
  const isDefaultEdition = edition.id === nft.defaultEditionId;

  return (
    <div className="flex flex-col gap-4 lg:gap-3.5">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground lg:text-[1.75rem]">{nft.name}</h1>
          <RatingStars
            average={nft.rating.average}
            count={nft.rating.count}
            variant="compact"
            className="mt-1 md:hidden"
          />
        </div>
        <div className="hidden flex-wrap items-center justify-between gap-2 md:flex lg:border-b lg:border-primary/30 lg:pb-2">
          <EthPrice
            value={edition.price}
            previousValue={isDefaultEdition ? nft.previousPrice : null}
            className="text-lg lg:text-[1.375rem]"
          />
          <RatingStars
            average={nft.rating.average}
            count={nft.rating.count}
            className="lg:text-base lg:text-foreground"
          />
        </div>
      </header>

      <section aria-labelledby={aboutId} className="flex flex-col gap-2">
        <h2 id={aboutId} className="hidden text-sm font-bold md:block lg:text-[0.9375rem]">
          Sobre este NFT:
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-xs lg:text-sm lg:leading-6">
          {nft.description}
        </p>
      </section>

      <EditionSelector editions={nft.editions} selectedId={edition.id} onSelect={onEditionChange} />

      <div className="hidden flex-wrap items-center justify-between gap-4 md:flex">
        <QuantityStepper
          label={`Quantidade de ${nft.name}`}
          value={quantity}
          max={Math.max(1, limit.max)}
          onChange={onQuantityChange}
          disabled={!isAvailable}
          size="lg"
          limitMessage={
            isAvailable && quantity >= limit.max ? describeQuantityLimit(limit) : undefined
          }
        />
        <DesktopPurchaseActions nft={nft} edition={edition} quantity={quantity} />
      </div>

      <dl className="grid gap-2 text-sm text-muted-foreground md:text-xs lg:gap-3 lg:text-[0.9375rem]">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>{nft.tokenId}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>{nft.collection.name}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>{nft.attributes.join(', ')}</dd>
        </div>
      </dl>

      <div className="hidden md:block">
        <NftShareLinks nftName={nft.name} url={shareUrl} />
      </div>
    </div>
  );
}
