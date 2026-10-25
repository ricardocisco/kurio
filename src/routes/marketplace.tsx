import { createFileRoute, stripSearchParams } from '@tanstack/react-router';

import type { CatalogSearchChangeHandler } from '@/features/catalog/components/CatalogSection';
import { prefetchCatalog } from '@/features/catalog/model/catalog-route';
import {
  applyCatalogSearchPatch,
  CATALOG_SEARCH_DEFAULTS,
  catalogSearchSchema,
} from '@/features/catalog/model/catalog-search';
import { MarketplacePage } from '@/features/catalog/pages/MarketplacePage';

export const Route = createFileRoute('/marketplace')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    prefetchCatalog(context.queryClient, deps);
  },
  head: () => ({ meta: [{ title: 'Mercado · Kurio' }] }),
  component: MarketplaceRoute,
});

function MarketplaceRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleSearchChange: CatalogSearchChangeHandler = (patch, options) => {
    void navigate({
      search: (previous) => applyCatalogSearchPatch(previous, patch),
      replace: options?.replace,
      resetScroll: false,
    });
  };

  return <MarketplacePage search={search} onSearchChange={handleSearchChange} />;
}
