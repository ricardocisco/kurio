import { cn } from '@/shared/lib/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { catalogSortSchema, catalogTabSchema } from '@/shared/contracts/nft';

import {
  CATALOG_SORT_LABELS,
  CATALOG_TAB_LABELS,
  type CatalogSearch,
  type CatalogSearchPatch,
} from '../model/catalog-search';

interface CatalogToolbarProps {
  search: CatalogSearch;
  onSearchChange: (patch: CatalogSearchPatch) => void;
}

export function CatalogToolbar({ search, onSearchChange }: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div
        role="group"
        aria-label="Filtrar listagem"
        className="-mx-1 flex gap-4 overflow-x-auto px-1 lg:gap-5"
      >
        {catalogTabSchema.options.map((tab) => {
          const isActive = search.tab === tab;
          return (
            <button
              key={tab}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSearchChange({ tab })}
              className={cn(
                'shrink-0 border-b-2 border-transparent py-1 text-sm whitespace-nowrap text-foreground transition-colors hover:text-primary lg:text-[0.9375rem]',
                isActive && 'border-primary font-medium text-primary',
              )}
            >
              {CATALOG_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 text-xs text-text-secondary lg:text-[0.9375rem]">
        <span id="catalog-sort-label">Ordenar por:</span>
        <Select
          value={search.sort}
          onValueChange={(value) => onSearchChange({ sort: catalogSortSchema.parse(value) })}
        >
          <SelectTrigger
            aria-labelledby="catalog-sort-label"
            className="h-8 w-auto gap-1 border-none bg-transparent px-1 text-xs text-text-secondary lg:text-[0.9375rem]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {catalogSortSchema.options.map((sort) => (
              <SelectItem key={sort} value={sort} className="text-xs">
                {CATALOG_SORT_LABELS[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
