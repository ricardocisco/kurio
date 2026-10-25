import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface ScrollCarouselProps {
  /** Accessible name of the carousel region. */
  label: string;
  items: ReactNode[];
  /** Width of each slide, e.g. "basis-[45%] md:basis-[calc((100%-4rem)/5)]". */
  itemClassName: string;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lightweight carousel built on native horizontal scrolling with scroll-snap: works with touch,
 * trackpad and keyboard (focus moves the scroll), with page dots as in the Figma frames.
 */
export function ScrollCarousel({ label, items, itemClassName, className }: ScrollCarouselProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list || list.clientWidth === 0) return;
    setPageCount(Math.max(1, Math.ceil(list.scrollWidth / list.clientWidth - 0.05)));
    const isAtEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
    setActivePage(
      isAtEnd
        ? Math.ceil(list.scrollWidth / list.clientWidth - 0.05) - 1
        : Math.round(list.scrollLeft / list.clientWidth),
    );
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure, items.length]);

  const goToPage = (page: number) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({
      left: page * list.clientWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      className={cn('flex flex-col gap-4', className)}
    >
      <ul
        ref={listRef}
        onScroll={measure}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth pb-1 motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <li key={index} className={cn('shrink-0 snap-start', itemClassName)}>
            {item}
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <div role="group" aria-label={`Páginas de ${label}`} className="flex justify-center">
          {Array.from({ length: pageCount }, (_, page) => (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-label={`Ir para a página ${page + 1} de ${pageCount}`}
              aria-pressed={page === activePage}
              className="group flex size-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-2.5 rounded-full border border-primary transition-colors',
                  page === activePage && 'bg-primary',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
