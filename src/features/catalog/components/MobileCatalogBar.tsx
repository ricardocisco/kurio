import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useId, useState } from 'react';

import type { CatalogFacets } from '@/shared/contracts/nft';
import { useDebouncedCallback } from '@/shared/hooks/use-debounced-callback';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';

import {
  countActiveFilters,
  type CatalogSearch,
  type CatalogSearchPatch,
} from '../model/catalog-search';

import { CatalogFilters } from './CatalogFilters';

interface MobileCatalogBarProps {
  search: CatalogSearch;
  facets: CatalogFacets | undefined;
  onSearchChange: (patch: CatalogSearchPatch, options?: { replace?: boolean }) => void;
}

const SEARCH_DEBOUNCE_MS = 350;

/** Mobile frame: "Explorar coleções" search field + filter drawer button. */
export function MobileCatalogBar({ search, facets, onSearchChange }: MobileCatalogBarProps) {
  const inputId = useId();
  const [term, setTerm] = useState(search.q ?? '');
  const [syncedQuery, setSyncedQuery] = useState(search.q);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Sync the field when the URL changes elsewhere (chip removed, history navigation).
  // Adjusting state during render avoids an extra effect pass (React "derived state" pattern).
  if (search.q !== syncedQuery) {
    setSyncedQuery(search.q);
    if ((search.q ?? '') !== term.trim()) setTerm(search.q ?? '');
  }
  const activeFilters = countActiveFilters(search);

  // Typing replaces the history entry, so "back" does not step through every keystroke.
  const commitSearch = useDebouncedCallback((value: string) => {
    onSearchChange({ q: value.trim() || undefined }, { replace: true });
  }, SEARCH_DEBOUNCE_MS);

  return (
    <div className="flex gap-3 md:hidden">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          commitSearch.cancel();
          onSearchChange({ q: term.trim() || undefined });
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Explorar coleções
        </label>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            commitSearch(event.target.value);
          }}
          placeholder="Explorar coleções"
          maxLength={80}
          autoComplete="off"
          className="h-12 w-full rounded-xl bg-card pr-3 pl-11 text-sm text-foreground placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-ring"
        />
      </form>

      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetTrigger asChild>
          <Button
            variant="gradient"
            size="icon"
            className="relative size-12 rounded-xl"
            aria-label={activeFilters > 0 ? `Filtros (${activeFilters} ativos)` : 'Abrir filtros'}
          >
            <SlidersHorizontalIcon className="size-5" aria-hidden="true" />
            {activeFilters > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[0.625rem] font-bold text-background"
              >
                {activeFilters}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Os resultados são atualizados a cada alteração.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <CatalogFilters facets={facets} search={search} onSearchChange={onSearchChange} />
          </div>
          <div className="sticky bottom-0 mt-auto bg-card p-4">
            <Button className="w-full" onClick={() => setIsFiltersOpen(false)}>
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
