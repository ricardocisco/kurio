import { http } from 'msw';

import {
  catalogQueryParamsSchema,
  type CatalogFacets,
  type CatalogPage,
  type CatalogQuery,
  type FeaturedNfts,
  type NftDetail,
} from '@/shared/contracts/nft';
import { compareEth } from '@/shared/lib/money';

import { getScenarioFlags } from '../config/scenarios';
import { readDatabase } from '../db/database';
import {
  CATEGORY_LABELS,
  MOCK_REFERENCE_DATE,
  NETWORK_LABELS,
  NEW_LISTING_WINDOW_DAYS,
} from '../fixtures/nfts';
import { apiPath } from '../utils/api-path';
import { toNftSummary } from '../utils/projections';
import { errorResponse, jsonResponse } from '../utils/responses';

const NEW_LISTING_THRESHOLD =
  MOCK_REFERENCE_DATE.getTime() - NEW_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function listedNfts(): readonly NftDetail[] {
  return getScenarioFlags().emptyCatalog ? [] : readDatabase().nfts;
}

type FacetKey = 'categories' | 'networks';

/** Applies every filter except the ones listed in `ignore` (used to compute facet counts). */
function applyFilters(
  nfts: readonly NftDetail[],
  query: CatalogQuery,
  ignore: FacetKey[] = [],
): NftDetail[] {
  const search = query.search ? normalizeText(query.search) : '';
  return nfts.filter((nft) => {
    if (search) {
      const haystack = normalizeText(`${nft.name} ${nft.collection.name} ${nft.tokenId}`);
      if (!haystack.includes(search)) return false;
    }
    if (query.tab === 'new' && new Date(nft.listedAt).getTime() < NEW_LISTING_THRESHOLD) {
      return false;
    }
    if (query.tab === 'trending' && !nft.isTrending) return false;
    if (
      !ignore.includes('categories') &&
      query.categories.length > 0 &&
      !query.categories.includes(nft.category)
    ) {
      return false;
    }
    if (
      !ignore.includes('networks') &&
      query.networks.length > 0 &&
      !query.networks.includes(nft.network)
    ) {
      return false;
    }
    if (query.minPrice && compareEth(nft.price, query.minPrice) < 0) return false;
    if (query.maxPrice && compareEth(nft.price, query.maxPrice) > 0) return false;
    return true;
  });
}

function sortNfts(nfts: NftDetail[], sort: CatalogQuery['sort']): NftDetail[] {
  const sorted = [...nfts];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => compareEth(a.price, b.price) || a.name.localeCompare(b.name));
    case 'price-desc':
      return sorted.sort((a, b) => compareEth(b.price, a.price) || a.name.localeCompare(b.name));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    case 'recent':
      return sorted.sort((a, b) => b.listedAt.localeCompare(a.listedAt));
  }
}

function buildFacets(nfts: readonly NftDetail[], query: CatalogQuery): CatalogFacets {
  const forCategories = applyFilters(nfts, query, ['categories']);
  const forNetworks = applyFilters(nfts, query, ['networks']);
  const prices = nfts.map((nft) => nft.price).sort(compareEth);

  return {
    categories: Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id: id as keyof typeof CATEGORY_LABELS,
      label,
      count: forCategories.filter((nft) => nft.category === id).length,
    })),
    networks: Object.entries(NETWORK_LABELS).map(([id, label]) => ({
      id: id as keyof typeof NETWORK_LABELS,
      label,
      count: forNetworks.filter((nft) => nft.network === id).length,
    })),
    priceRange: { min: prices[0] ?? '0', max: prices.at(-1) ?? '0' },
  };
}

export const catalogHandlers = [
  http.get(apiPath('/nfts/featured'), () => {
    const nfts = readDatabase().nfts;
    const bySlug = (id: string) => nfts.find((nft) => nft.id === id);
    const heroSlides = ['emerald-ape-0042', 'ivory-baron-0088', 'golden-beat-0207']
      .map(bySlug)
      .filter((nft): nft is NftDetail => Boolean(nft))
      .map(toNftSummary);
    const spotlight = bySlug('cosmic-bloom-0118') ?? nfts[0];

    if (heroSlides.length === 0 || !spotlight) {
      return errorResponse('NOT_FOUND', 'Nenhum destaque disponível.');
    }
    return jsonResponse<FeaturedNfts>({ heroSlides, spotlight: toNftSummary(spotlight) });
  }),

  http.get(apiPath('/nfts'), ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = catalogQueryParamsSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Parâmetros de busca inválidos.', {
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join('.'), [issue.message]]),
        ),
      });
    }

    const query = parsed.data;
    const nfts = listedNfts();
    const filtered = sortNfts(applyFilters(nfts, query), query.sort);
    const totalPages = Math.ceil(filtered.length / query.pageSize);
    const start = (query.page - 1) * query.pageSize;

    return jsonResponse<CatalogPage>({
      items: filtered.slice(start, start + query.pageSize).map(toNftSummary),
      page: query.page,
      pageSize: query.pageSize,
      totalItems: filtered.length,
      totalPages,
      facets: buildFacets(nfts, query),
    });
  }),

  http.get<{ nftId: string }>(apiPath('/nfts/:nftId'), ({ params }) => {
    const nft = listedNfts().find((item) => item.id === params.nftId);
    if (!nft) return errorResponse('NOT_FOUND', 'NFT não encontrado.');
    return jsonResponse<NftDetail>(nft);
  }),
];
