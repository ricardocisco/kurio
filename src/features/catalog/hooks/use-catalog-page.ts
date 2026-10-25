import { useQuery } from '@tanstack/react-query';

import { catalogPageQueryOptions } from '@/features/nfts/api/nft.queries';

import { toCatalogQuery, type CatalogSearch } from '../model/catalog-search';

export function useCatalogPage(search: CatalogSearch) {
  const query = useQuery(catalogPageQueryOptions(toCatalogQuery(search)));

  return {
    ...query,
    isInitialLoading: query.isPending,
    isUpdating: query.isFetching && (query.isPlaceholderData || !query.isPending),
  };
}
