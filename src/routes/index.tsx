import { createFileRoute, stripSearchParams } from '@tanstack/react-router';

import type { CatalogSearchChangeHandler } from '@/features/catalog/components/CatalogSection';
import { prefetchCatalog } from '@/features/catalog/model/catalog-route';
import {
  applyCatalogSearchPatch,
  CATALOG_SEARCH_DEFAULTS,
  catalogSearchSchema,
} from '@/features/catalog/model/catalog-search';
import { HomePage } from '@/features/home/pages/HomePage';

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    prefetchCatalog(context.queryClient, deps, { includeFeatured: true });
  },
  head: () => ({ meta: [{ title: 'Kurio · Seja dono do futuro da arte digital' }] }),
  component: HomeRoute,
});

function HomeRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleSearchChange: CatalogSearchChangeHandler = (patch, options) => {
    void navigate({
      search: (previous) => applyCatalogSearchPatch(previous, patch),
      replace: options?.replace,
      resetScroll: false,
    });
  };

  return <HomePage search={search} onSearchChange={handleSearchChange} />;
}
