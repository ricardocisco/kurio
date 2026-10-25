import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { nftDetailQueryOptions } from '@/features/nfts/api/nft.queries';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

import { MobileDetailHeader } from '../components/MobileDetailHeader';
import { MobilePurchaseBar } from '../components/MobilePurchaseBar';
import { NftDetailTabs } from '../components/NftDetailTabs';
import { NftGallery } from '../components/NftGallery';
import { NftPurchasePanel } from '../components/NftPurchasePanel';
import { RelatedNfts } from '../components/RelatedNfts';
import { clampQuantity, getQuantityLimit, resolveSelectedEdition } from '../model/edition';

interface NftDetailPageProps {
  nftId: string;
  selectedEditionId: string | undefined;
  onEditionChange: (editionId: string) => void;
}

export function NftDetailPage({ nftId, selectedEditionId, onEditionChange }: NftDetailPageProps) {
  const { data: nft } = useSuspenseQuery(nftDetailQueryOptions(nftId));
  const [requestedQuantity, setRequestedQuantity] = useState(1);

  const edition = resolveSelectedEdition(nft, selectedEditionId);
  const quantity = Math.max(1, clampQuantity(requestedQuantity, getQuantityLimit(edition)));

  const handleEditionChange = (editionId: string) => {
    setRequestedQuantity(1);
    onEditionChange(editionId);
  };

  return (
    <>
      <MobileDetailHeader nft={nft} />
      <div className="container-content flex flex-col gap-10 py-4 md:gap-16 md:py-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs
            className="hidden md:block"
            items={[
              { label: 'Início', link: { to: '/' } },
              { label: 'Mercado', link: { to: '/marketplace' } },
              { label: nft.name },
            ]}
          />
          <div className="grid items-start gap-6 md:grid-cols-2 lg:gap-12">
            <NftGallery images={nft.gallery} nftName={nft.name} />
            <NftPurchasePanel
              nft={nft}
              edition={edition}
              quantity={quantity}
              onQuantityChange={setRequestedQuantity}
              onEditionChange={handleEditionChange}
              shareUrl={`${window.location.origin}/nfts/${nft.id}`}
            />
          </div>
        </div>
        <NftDetailTabs nft={nft} />
        <RelatedNfts nftId={nft.id} />
      </div>
      <MobilePurchaseBar
        nft={nft}
        edition={edition}
        quantity={quantity}
        onQuantityChange={setRequestedQuantity}
      />
    </>
  );
}
