import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import type { CatalogQuery } from '@/shared/contracts/nft';

import { fetchCatalogPage, fetchFeaturedNfts, fetchNftDetail } from './nfts.api';

/**
 * Query key factory. Public NFT data is not user-scoped; every parameter that changes the response
 * is part of the key, so results are isolated per query and never mixed between filters.
 */
export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: CatalogQuery) => [...nftKeys.lists(), query] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...nftKeys.details(), nftId] as const,
};

export function catalogPageQueryOptions(query: CatalogQuery) {
  return queryOptions({
    queryKey: nftKeys.list(query),
    queryFn: ({ signal }) => fetchCatalogPage(query, signal),
    // Keeps the previous page on screen while the next one loads (no layout jump).
    placeholderData: keepPreviousData,
  });
}

export function featuredNftsQueryOptions() {
  return queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
    staleTime: 5 * 60_000,
  });
}

export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNftDetail(nftId, signal),
  });
}
