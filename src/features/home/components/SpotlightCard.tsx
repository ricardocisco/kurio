import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { featuredNftsQueryOptions } from '@/features/nfts/api/nft.queries';
import { NftImage } from '@/features/nfts/components/NftImage';
import { Skeleton } from '@/shared/ui/skeleton';

export function SpotlightCard() {
  const featured = useQuery(featuredNftsQueryOptions());
  const spotlight = featured.data?.spotlight;

  return (
    <section
      aria-labelledby="spotlight-title"
      className="relative flex flex-col overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--kurio-750)_0%,var(--kurio-850)_60%)]"
    >
      <div className="flex flex-col gap-1 px-4 pt-4 pb-3 lg:gap-3 lg:px-5 lg:pt-6">
        <h2 id="spotlight-title" className="text-lg font-bold text-primary uppercase lg:text-2xl">
          NFT em destaque
        </h2>
        <p className="text-start text-sm font-bold tracking-wide uppercase lg:text-[1.375rem]">
          Oferta limitada
        </p>
      </div>
      {spotlight ? (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: spotlight.id }}
          className="block overflow-hidden rounded-2xl focus-visible:-outline-offset-4"
        >
          <NftImage image={spotlight.image} sizes="310px" className="lg:aspect-61/72" />
          <span className="sr-only">Ver {spotlight.name}</span>
        </Link>
      ) : (
        <Skeleton className="aspect-square w-full rounded-2xl lg:aspect-61/72" />
      )}
    </section>
  );
}
