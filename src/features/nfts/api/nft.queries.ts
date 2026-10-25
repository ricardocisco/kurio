import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query';

import type { CatalogQuery } from '@/shared/contracts/nft';

import {
  fetchCatalogPage,
  fetchFeaturedNfts,
  fetchNftDetail,
  fetchNftReviews,
  fetchRelatedNfts,
} from './nfts.api';

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: CatalogQuery) => [...nftKeys.lists(), query] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...nftKeys.details(), nftId] as const,
  reviews: (nftId: string) => [...nftKeys.detail(nftId), 'reviews'] as const,
  related: (nftId: string) => [...nftKeys.detail(nftId), 'related'] as const,
};

export function catalogPageQueryOptions(query: CatalogQuery) {
  return queryOptions({
    queryKey: nftKeys.list(query),
    queryFn: ({ signal }) => fetchCatalogPage(query, signal),
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

export function nftReviewsInfiniteQueryOptions(nftId: string) {
  return infiniteQueryOptions({
    queryKey: nftKeys.reviews(nftId),
    queryFn: ({ pageParam, signal }) => fetchNftReviews(nftId, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60_000,
  });
}

export function relatedNftsQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: nftKeys.related(nftId),
    queryFn: ({ signal }) => fetchRelatedNfts(nftId, signal),
    staleTime: 5 * 60_000,
  });
}
