import { ZoomInIcon } from 'lucide-react';
import { useState } from 'react';

import { NftImage } from '@/features/nfts/components/NftImage';
import type { NftImage as NftImageData } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';

interface NftGalleryProps {
  images: NftImageData[];
  nftName: string;
}

export function NftGallery({ images, nftName }: NftGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];
  if (!activeImage) return null;

  return (
    <div className="grid gap-4 md:grid-cols-[4.5rem_1fr] lg:grid-cols-[6.25rem_1fr] lg:gap-6">
      {images.length > 1 && (
        <ul aria-label="Imagens do NFT" className="hidden flex-col gap-4 md:flex">
          {images.map((image, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Mostrar imagem ${index + 1} de ${images.length}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  'block overflow-hidden rounded-sm border-2 border-transparent transition-colors hover:border-primary/60',
                  index === activeIndex && 'border-primary',
                )}
              >
                <NftImage image={{ ...image, alt: '' }} sizes="100px" className="rounded-xs" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-card md:rounded-2xl md:p-6">
        <NftImage
          image={activeImage}
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 40vw, 100vw"
          priority
          className="rounded-2xl md:rounded-xl"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="absolute top-2 right-2 hidden size-8 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:text-primary md:flex"
              aria-label={`Ampliar imagem de ${nftName}`}
            >
              <ZoomInIcon className="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent withAccentBar={false} className="max-w-3xl p-3 sm:p-4">
            <DialogTitle className="sr-only">{nftName}</DialogTitle>
            <img
              src={activeImage.large}
              alt={activeImage.alt}
              width={1200}
              height={1200}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
