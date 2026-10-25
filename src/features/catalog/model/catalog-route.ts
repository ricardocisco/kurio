import type { QueryClient } from '@tanstack/react-query';

import { catalogPageQueryOptions, featuredNftsQueryOptions } from '@/features/nfts/api/nft.queries';

import { toCatalogQuery, type CatalogSearch } from './catalog-search';

export function prefetchCatalog(
  queryClient: QueryClient,
  search: CatalogSearch,
  options: { includeFeatured?: boolean } = {},
): void {
  void queryClient.prefetchQuery(catalogPageQueryOptions(toCatalogQuery(search)));
  if (options.includeFeatured) void queryClient.prefetchQuery(featuredNftsQueryOptions());
}
