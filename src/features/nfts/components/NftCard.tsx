import { Link } from '@tanstack/react-router';

import { EthPrice } from '@/shared/components/EthPrice';
import type { NftSummary } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { NftImage } from './NftImage';

interface NftCardProps {
  nft: NftSummary;
  /** `sizes` for the artwork; defaults to the 3-column desktop / 2-column mobile grid. */
  imageSizes?: string;
  priority?: boolean;
  className?: string;
}

const DEFAULT_SIZES = '(min-width: 1280px) 260px, (min-width: 768px) 30vw, 45vw';

export function NftCard({ nft, imageSizes = DEFAULT_SIZES, priority, className }: NftCardProps) {
  return (
    <article className={cn('group relative flex flex-col gap-2', className)}>
      <div className="relative overflow-hidden rounded-xl bg-card p-2 md:rounded-sm md:p-3">
        <NftImage
          image={nft.image}
          sizes={imageSizes}
          priority={priority}
          className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        {nft.rarity !== 'common' && (
          <span className="absolute top-2 left-2 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground uppercase md:top-3 md:left-3">
            {nft.rarity === 'rare' ? 'Raro' : 'Lendário'}
          </span>
        )}
        {nft.isSoldOut && (
          <span className="absolute right-3 bottom-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-bold text-foreground">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-1">
        <h3 className="text-sm text-text-secondary">
          {/* The stretched link makes the whole card clickable with a single tab stop. */}
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <EthPrice value={nft.price} previousValue={nft.previousPrice} className="text-sm" />
      </div>
    </article>
  );
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      <div className="rounded-xl bg-card p-2 md:rounded-sm md:p-3">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
      <div className="flex flex-col gap-1.5 px-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
