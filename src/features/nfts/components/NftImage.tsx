import type * as React from 'react';

import type { NftImage as NftImageData } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';

interface NftImageProps extends Omit<React.ComponentProps<'img'>, 'src' | 'srcSet' | 'alt'> {
  image: NftImageData;
  /** `sizes` attribute describing the rendered width at each breakpoint. */
  sizes: string;
  /** Marks the image as the LCP candidate: eager load with high fetch priority. */
  priority?: boolean;
}

/** Responsive NFT artwork with intrinsic size to prevent layout shift. */
export function NftImage({ image, sizes, priority = false, className, ...props }: NftImageProps) {
  return (
    <img
      src={image.medium}
      srcSet={`${image.small} 400w, ${image.medium} 800w, ${image.large} 1200w`}
      sizes={sizes}
      alt={image.alt}
      width={800}
      height={800}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn('aspect-square w-full object-cover', className)}
      {...props}
    />
  );
}
