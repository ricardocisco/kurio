import { useQuery } from '@tanstack/react-query';

import { catalogPageQueryOptions } from '@/features/nfts/api/nft.queries';

import { toCatalogQuery, type CatalogSearch } from '../model/catalog-search';

/** Catalog listing derived from URL state. Exposes explicit UI states for the grid. */
export function useCatalogPage(search: CatalogSearch) {
  const query = useQuery(catalogPageQueryOptions(toCatalogQuery(search)));

  return {
    ...query,
    /** First load without any data to show yet. */
    isInitialLoading: query.isPending,
    /** Showing previous results while the new parameters load (background update). */
    isUpdating: query.isFetching && (query.isPlaceholderData || !query.isPending),
  };
}
