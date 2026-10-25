import { useQuery } from '@tanstack/react-query';

import { relatedNftsQueryOptions } from '@/features/nfts/api/nft.queries';
import { NftCard, NftCardSkeleton } from '@/features/nfts/components/NftCard';
import { ScrollCarousel } from '@/shared/components/ScrollCarousel';

const ITEM_CLASS = 'basis-[45%] sm:basis-[30%] md:basis-[calc((100%-4rem)/5)]';
const IMAGE_SIZES = '(min-width: 1280px) 225px, (min-width: 768px) 18vw, 45vw';

export function RelatedNfts({
  nftId,
  title = 'Mais desta coleção',
}: {
  nftId: string;
  title?: string;
}) {
  const related = useQuery(relatedNftsQueryOptions(nftId));

  if (related.isError || related.data?.items.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-6">
      <h2
        id="related-title"
        className="w-full border-b border-primary/50 pb-2 text-sm font-bold text-primary md:w-5/6"
      >
        {title}
      </h2>
      {related.data ? (
        <ScrollCarousel
          label={title}
          itemClassName={ITEM_CLASS}
          items={related.data.items.map((nft) => (
            <NftCard key={nft.id} nft={nft} imageSizes={IMAGE_SIZES} />
          ))}
        />
      ) : (
        <div className="flex gap-4 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <NftCardSkeleton key={index} className={`shrink-0 ${ITEM_CLASS}`} />
          ))}
        </div>
      )}
    </section>
  );
}
