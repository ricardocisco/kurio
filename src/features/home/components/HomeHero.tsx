import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';

import { featuredNftsQueryOptions } from '@/features/nfts/api/nft.queries';
import { NftImage } from '@/features/nfts/components/NftImage';
import type { NftSummary } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

interface SlideDotsProps {
  slides: NftSummary[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

function SlideDots({ slides, activeIndex, onSelect, className }: SlideDotsProps) {
  return (
    <div role="group" aria-label="Destaques" className={cn('flex', className)}>
      {slides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Mostrar destaque ${index + 1}: ${slide.name}`}
          aria-pressed={index === activeIndex}
          className="group flex size-6 items-center justify-center rounded-full md:size-6"
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-2.5 rounded-full bg-primary/40 transition-colors group-hover:bg-primary/70',
              index === activeIndex && 'bg-primary',
            )}
          />
        </button>
      ))}
    </div>
  );
}

function useHeroSlides() {
  const featured = useQuery(featuredNftsQueryOptions());
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = featured.data?.heroSlides ?? [];
  return { slides, activeIndex, setActiveIndex, activeSlide: slides[activeIndex] ?? slides[0] };
}

export function DesktopHomeHero() {
  const { slides, activeIndex, setActiveIndex, activeSlide } = useHeroSlides();

  return (
    <section
      aria-labelledby="hero-title-desktop"
      className="container-content hidden grid-cols-[1fr_minmax(0,28rem)] items-center gap-10 py-8 md:grid lg:pt-8 lg:pb-9"
    >
      <div className="flex flex-col gap-4 lg:pl-10">
        <p className="text-sm text-foreground lg:text-base">Bem-vindo à Kurio</p>
        <h1
          id="hero-title-desktop"
          className="text-3xl leading-[1.75] font-bold tracking-tight text-foreground uppercase lg:-mt-3 lg:-mb-3 lg:text-[2.25rem] lg:leading-[1.6] xl:text-[2.75rem]"
        >
          Seja dono do futuro
          <br />
          da arte digital
        </h1>
        <p className="max-w-[35rem] text-xs leading-relaxed text-muted-foreground lg:text-sm lg:leading-6">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <Button
          asChild
          size="md"
          className="mt-4 w-fit px-7 text-sm uppercase lg:px-8 lg:text-base"
        >
          <a href="#catalogo">Explorar</a>
        </Button>
        {slides.length > 1 && (
          <SlideDots
            slides={slides}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            className="mt-6 self-end"
          />
        )}
      </div>
      <div className="overflow-hidden rounded-2xl">
        {activeSlide ? (
          <NftImage image={activeSlide.image} sizes="(min-width: 1280px) 450px, 40vw" priority />
        ) : (
          <Skeleton className="aspect-square w-full rounded-2xl" />
        )}
      </div>
    </section>
  );
}

export function MobileHomeHero() {
  const { slides, activeIndex, setActiveIndex, activeSlide } = useHeroSlides();
  const companionSlide = slides.length > 1 ? slides[(activeIndex + 1) % slides.length] : undefined;

  return (
    <section
      aria-labelledby="hero-title-mobile"
      className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_60%,var(--kurio-copper-deep)_0%,var(--kurio-700)_45%,var(--kurio-850)_100%)] px-4 pt-3 pb-1 md:hidden"
    >
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-xs text-foreground">Bem-vindo à Kurio</p>
          <h1 id="hero-title-mobile" className="text-base leading-normal font-bold uppercase">
            Seja dono da cultura digital
          </h1>
          <p className="text-xs leading-relaxed text-text-secondary">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a
            href="#catalog-title"
            className="mt-1 inline-flex w-fit items-center gap-2 text-xs font-bold text-primary uppercase"
          >
            Explorar
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </a>
        </div>
        <div className="relative w-[38%] shrink-0">
          {activeSlide ? (
            <NftImage image={activeSlide.image} sizes="40vw" priority className="rounded-xl" />
          ) : (
            <Skeleton className="aspect-square w-full rounded-xl" />
          )}
          {companionSlide && (
            <NftImage
              image={{ ...companionSlide.image, alt: '' }}
              sizes="20vw"
              className="absolute -bottom-2 -left-3 w-[42%] rounded-lg border-2 border-card"
            />
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <SlideDots
          slides={slides}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          className="relative z-10 justify-center"
        />
      )}
    </section>
  );
}
