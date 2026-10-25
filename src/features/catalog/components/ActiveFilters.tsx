import { XIcon } from 'lucide-react';

import type { CatalogFacets } from '@/shared/contracts/nft';
import { formatEth } from '@/shared/lib/money';

import type { CatalogSearch, CatalogSearchPatch } from '../model/catalog-search';

interface ActiveFiltersProps {
  search: CatalogSearch;
  facets: CatalogFacets | undefined;
  onSearchChange: (patch: CatalogSearchPatch) => void;
}

interface Chip {
  key: string;
  label: string;
  patch: CatalogSearchPatch;
}

/** Removable chips for every active filter, plus "clear all". */
export function ActiveFilters({ search, facets, onSearchChange }: ActiveFiltersProps) {
  const labelFor = (list: { id: string; label: string }[] | undefined, id: string) =>
    list?.find((option) => option.id === id)?.label ?? id;

  const chips: Chip[] = [
    ...(search.q ? [{ key: 'q', label: `Busca: “${search.q}”`, patch: { q: undefined } }] : []),
    ...search.categories.map((id) => ({
      key: `category-${id}`,
      label: labelFor(facets?.categories, id),
      patch: { categories: search.categories.filter((item) => item !== id) },
    })),
    ...search.networks.map((id) => ({
      key: `network-${id}`,
      label: labelFor(facets?.networks, id),
      patch: { networks: search.networks.filter((item) => item !== id) },
    })),
    ...(search.minPrice || search.maxPrice
      ? [
          {
            key: 'price',
            label: `Preço: ${search.minPrice ? formatEth(search.minPrice) : 'mín.'} – ${search.maxPrice ? formatEth(search.maxPrice) : 'máx.'}`,
            patch: { minPrice: undefined, maxPrice: undefined },
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos" role="group">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onSearchChange(chip.patch)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/60 px-3 py-1 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          {chip.label}
          <XIcon className="size-3" aria-hidden="true" />
          <span className="sr-only">(remover filtro)</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onSearchChange({
            q: undefined,
            categories: [],
            networks: [],
            minPrice: undefined,
            maxPrice: undefined,
          })
        }
        className="text-xs text-primary underline-offset-4 hover:underline"
      >
        Limpar tudo
      </button>
    </div>
  );
}
