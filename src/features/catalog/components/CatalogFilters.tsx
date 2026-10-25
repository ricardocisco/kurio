import type { CatalogFacets } from '@/shared/contracts/nft';
import { Skeleton } from '@/shared/ui/skeleton';

import type { CatalogSearch, CatalogSearchPatch } from '../model/catalog-search';

import { FilterOptionList } from './FilterOptionList';
import { PriceRangeFilter } from './PriceRangeFilter';

interface CatalogFiltersProps {
  facets: CatalogFacets | undefined;
  search: CatalogSearch;
  onSearchChange: (patch: CatalogSearchPatch) => void;
}

function toggle<TId>(list: readonly TId[], id: TId): TId[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/** Filter panel shared by the desktop sidebar and the mobile drawer. */
export function CatalogFilters({ facets, search, onSearchChange }: CatalogFiltersProps) {
  if (!facets) return <CatalogFiltersSkeleton />;

  return (
    <div className="flex flex-col gap-8">
      <FilterOptionList
        title="Coleções"
        options={facets.categories}
        selected={search.categories}
        onToggle={(id) => onSearchChange({ categories: toggle(search.categories, id) })}
        emphasizeCounts
      />
      <PriceRangeFilter
        // Remount when the applied range changes externally (history navigation, clear filters).
        key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`}
        range={facets.priceRange}
        minPrice={search.minPrice}
        maxPrice={search.maxPrice}
        onApply={(minPrice, maxPrice) => onSearchChange({ minPrice, maxPrice })}
      />
      <FilterOptionList
        title="Rede"
        options={facets.networks}
        selected={search.networks}
        onToggle={(id) => onSearchChange({ networks: toggle(search.networks, id) })}
      />
    </div>
  );
}

function CatalogFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      {[9, 2, 3].map((rows, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
