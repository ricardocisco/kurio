import { useRef, type ReactNode } from 'react';

import { useCatalogPage } from '../hooks/use-catalog-page';
import {
  countActiveFilters,
  type CatalogSearch,
  type CatalogSearchPatch,
} from '../model/catalog-search';

import { ActiveFilters } from './ActiveFilters';
import { CatalogFilters } from './CatalogFilters';
import { CatalogPagination } from './CatalogPagination';
import { CatalogResults } from './CatalogResults';
import { CatalogToolbar } from './CatalogToolbar';
import { MobileCatalogBar } from './MobileCatalogBar';

export type CatalogSearchChangeHandler = (
  patch: CatalogSearchPatch,
  options?: { replace?: boolean },
) => void;

interface CatalogSectionProps {
  search: CatalogSearch;
  onSearchChange: CatalogSearchChangeHandler;
  title: string;
  sidebarAddon?: ReactNode;
  mobileHeader?: ReactNode;
}

export function CatalogSection({
  search,
  onSearchChange,
  title,
  sidebarAddon,
  mobileHeader,
}: CatalogSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const catalog = useCatalogPage(search);
  const facets = catalog.data?.facets;
  const hasActiveFilters = countActiveFilters(search) > 0 || Boolean(search.q);

  const handlePageChange = (page: number) => {
    onSearchChange({ page });
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const clearFilters = () =>
    onSearchChange({
      q: undefined,
      categories: [],
      networks: [],
      minPrice: undefined,
      maxPrice: undefined,
    });

  return (
    <section
      ref={sectionRef}
      id="catalogo"
      aria-labelledby="catalog-title"
      className="container-content scroll-mt-24"
    >
      <div className="flex flex-col gap-6 md:hidden">
        <MobileCatalogBar search={search} facets={facets} onSearchChange={onSearchChange} />
        {mobileHeader}
      </div>

      <h2 id="catalog-title" className="sr-only">
        {title}
      </h2>

      <div className="mt-6 grid gap-8 md:mt-0 md:grid-cols-[minmax(0,14rem)_1fr] lg:grid-cols-[var(--spacing-sidebar)_1fr] lg:gap-12">
        <aside aria-label="Filtros do catálogo" className="hidden flex-col gap-6 md:flex">
          <div className="bg-card px-5 py-5">
            <CatalogFilters facets={facets} search={search} onSearchChange={onSearchChange} />
          </div>
          {sidebarAddon}
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <CatalogToolbar search={search} onSearchChange={onSearchChange} />
          <ActiveFilters search={search} facets={facets} onSearchChange={onSearchChange} />
          <CatalogResults
            data={catalog.data}
            error={catalog.error}
            isInitialLoading={catalog.isInitialLoading}
            isUpdating={catalog.isUpdating}
            isRefetching={catalog.isRefetching}
            hasActiveFilters={hasActiveFilters}
            onRetry={() => void catalog.refetch()}
            onClearFilters={clearFilters}
            onGoToFirstPage={() => onSearchChange({ page: 1 })}
          />
          {catalog.data && (
            <CatalogPagination
              page={catalog.data.page}
              totalPages={catalog.data.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}
