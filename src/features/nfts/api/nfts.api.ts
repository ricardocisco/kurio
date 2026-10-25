import { getJson } from '@/shared/api/http-client';
import {
  catalogPageSchema,
  featuredNftsSchema,
  nftDetailSchema,
  type CatalogPage,
  type CatalogQuery,
  type FeaturedNfts,
  type NftDetail,
} from '@/shared/contracts/nft';

/**
 * REST access for NFTs. Every function forwards the AbortSignal provided by TanStack Query, so
 * superseded requests (e.g. the user changed a filter) are cancelled at the transport level.
 */
export function fetchCatalogPage(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
  return getJson('/nfts', catalogPageSchema, { params: query, signal });
}

export function fetchFeaturedNfts(signal?: AbortSignal): Promise<FeaturedNfts> {
  return getJson('/nfts/featured', featuredNftsSchema, { signal });
}

export function fetchNftDetail(nftId: string, signal?: AbortSignal): Promise<NftDetail> {
  return getJson(`/nfts/${encodeURIComponent(nftId)}`, nftDetailSchema, { signal });
}
