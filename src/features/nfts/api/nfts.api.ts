import { getJson } from '@/shared/api/http-client';
import {
  catalogPageSchema,
  featuredNftsSchema,
  nftDetailSchema,
  nftReviewsPageSchema,
  relatedNftsSchema,
  type CatalogPage,
  type CatalogQuery,
  type FeaturedNfts,
  type NftDetail,
  type NftReviewsPage,
  type RelatedNfts,
} from '@/shared/contracts/nft';

export function fetchCatalogPage(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
  return getJson('/nfts', catalogPageSchema, { params: query, signal });
}

export function fetchFeaturedNfts(signal?: AbortSignal): Promise<FeaturedNfts> {
  return getJson('/nfts/featured', featuredNftsSchema, { signal });
}

export function fetchNftDetail(nftId: string, signal?: AbortSignal): Promise<NftDetail> {
  return getJson(`/nfts/${encodeURIComponent(nftId)}`, nftDetailSchema, { signal });
}

export function fetchNftReviews(
  nftId: string,
  page: number,
  signal?: AbortSignal,
): Promise<NftReviewsPage> {
  return getJson(`/nfts/${encodeURIComponent(nftId)}/reviews`, nftReviewsPageSchema, {
    params: { page },
    signal,
  });
}

export function fetchRelatedNfts(nftId: string, signal?: AbortSignal): Promise<RelatedNfts> {
  return getJson(`/nfts/${encodeURIComponent(nftId)}/related`, relatedNftsSchema, { signal });
}
