import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';

import { NftImage } from '@/features/nfts/components/NftImage';
import { Button } from '@/shared/ui/button';

import { PROMO_BANNERS, type PromoBanner } from '../model/home-content';

function BannerLink({ target }: { target: PromoBanner['target'] }) {
  const content = (
    <>
      Explorar
      <ArrowRightIcon aria-hidden="true" />
    </>
  );
  return (
    <Button asChild size="sm" className="mt-2 w-fit self-end px-4">
      {target === 'new-releases' ? (
        <Link to="/marketplace" search={{ tab: 'new' }}>
          {content}
        </Link>
      ) : (
        <Link to="/marketplace" search={{ categories: ['digital-art'] }}>
          {content}
        </Link>
      )}
    </Button>
  );
}

export function PromoBanners() {
  return (
    <section
      aria-label="Coleções em destaque"
      className="container-content mt-16 grid gap-4 md:grid-cols-2 md:gap-8"
    >
      {PROMO_BANNERS.map((banner) => (
        <article
          key={banner.title}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center overflow-hidden rounded-r-md bg-card"
        >
          <NftImage
            image={banner.image}
            sizes="(min-width: 1280px) 290px, (min-width: 768px) 20vw, 45vw"
            className="h-full rounded-xl"
          />
          <div className="flex flex-col gap-2 p-4 text-right">
            <h2 className="text-sm leading-snug font-bold text-foreground">{banner.title}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{banner.description}</p>
            <BannerLink target={banner.target} />
          </div>
        </article>
      ))}
    </section>
  );
}
