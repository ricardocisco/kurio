import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { EthPrice } from '@/shared/components/EthPrice';
import type { NftSummary } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { NftImage } from './NftImage';

interface NftCardProps {
  nft: NftSummary;
  imageSizes?: string;
  priority?: boolean;
  action?: ReactNode;
  className?: string;
}

const DEFAULT_SIZES = '(min-width: 1280px) 260px, (min-width: 768px) 30vw, 45vw';

export function NftCard({
  nft,
  imageSizes = DEFAULT_SIZES,
  priority,
  action,
  className,
}: NftCardProps) {
  return (
    <article
      className={cn('group relative flex flex-col gap-2 rounded-xl bg-card md:gap-3.5', className)}
    >
      <div className="relative m-2 overflow-hidden rounded-2xl md:rounded-sm md:px-1 md:py-6">
        <NftImage
          image={nft.image}
          sizes={imageSizes}
          priority={priority}
          className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        {nft.rarity !== 'common' && (
          <span className="absolute rounded-tl-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground uppercase md:top-6 md:left-1">
            {nft.rarity === 'rare' ? 'Raro' : 'Lendário'}
          </span>
        )}
        {action && (
          <div className="absolute z-10 transition-opacity md:top-6 md:right-1 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100 md:has-[[aria-pressed=true]]:opacity-100">
            {action}
          </div>
        )}
        {nft.isSoldOut && (
          <span className="absolute right-3 bottom-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-bold text-foreground">
            Esgotado
          </span>
        )}
      </div>
      <div className="m-2 flex flex-col gap-2 px-1 md:gap-1 md:px-0">
        <h3 className="text-[0.9rem] text-text-secondary md:text-base">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <EthPrice value={nft.price} previousValue={nft.previousPrice} className="text-base" />
      </div>
    </article>
  );
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      <div className="rounded-xl bg-card p-2 md:rounded-sm md:px-1 md:py-6">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
      <div className="flex flex-col gap-1.5 px-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
