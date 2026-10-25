import { useQuery } from '@tanstack/react-query';

import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { catalogPageQueryOptions } from '@/features/nfts/api/nft.queries';
import { NftCard } from '@/features/nfts/components/NftCard';
import { ScrollCarousel } from '@/shared/components/ScrollCarousel';
import { CATALOG_PAGE_SIZE, type CatalogQuery } from '@/shared/contracts/nft';

const TRENDING_QUERY: CatalogQuery = {
  tab: 'trending',
  categories: [],
  networks: [],
  sort: 'recent',
  page: 1,
  pageSize: CATALOG_PAGE_SIZE,
};

export function CartSuggestions({ excludeIds }: { excludeIds: string[] }) {
  const trending = useQuery(catalogPageQueryOptions(TRENDING_QUERY));
  const items = trending.data?.items.filter((nft) => !excludeIds.includes(nft.id)) ?? [];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="cart-suggestions-title" className="flex flex-col gap-6">
      <h2
        id="cart-suggestions-title"
        className="border-b border-primary/50 pb-2 text-sm font-bold text-primary"
      >
        Colecionadores também viram
      </h2>
      <ScrollCarousel
        label="Colecionadores também viram"
        itemClassName="basis-[45%] sm:basis-[30%] md:basis-[calc((100%-4rem)/5)]"
        items={items.map((nft) => (
          <NftCard
            key={nft.id}
            nft={nft}
            imageSizes="(min-width: 1280px) 225px, (min-width: 768px) 18vw, 45vw"
            action={<FavoriteButton nft={nft} variant="overlay" />}
          />
        ))}
      />
    </section>
  );
}
