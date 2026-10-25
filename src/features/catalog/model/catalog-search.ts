import { z } from 'zod';

import { ethAmountSchema } from '@/shared/contracts/common';
import {
  CATALOG_PAGE_SIZE,
  catalogSortSchema,
  catalogTabSchema,
  categoryIdSchema,
  networkIdSchema,
  type CatalogQuery,
} from '@/shared/contracts/nft';

/**
 * Catalog state lives in the URL (search, tab, filters, sort, page) so it survives refresh and is
 * restored by browser history. Invalid values fall back to defaults instead of breaking the page.
 */

/** TanStack Router parses JSON-looking values ("1.5" -> 1.5), so scalars are normalized to strings. */
const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value !== '' ? value : undefined;
};

export const catalogSearchSchema = z.object({
  q: z.preprocess(toOptionalString, z.string().trim().max(80).optional()).catch(undefined),
  tab: catalogTabSchema.default('all').catch('all'),
  categories: z.array(categoryIdSchema).default([]).catch([]),
  networks: z.array(networkIdSchema).default([]).catch([]),
  minPrice: z.preprocess(toOptionalString, ethAmountSchema.optional()).catch(undefined),
  maxPrice: z.preprocess(toOptionalString, ethAmountSchema.optional()).catch(undefined),
  sort: catalogSortSchema.default('recent').catch('recent'),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});

export type CatalogSearch = z.output<typeof catalogSearchSchema>;

/** Default values are stripped from the URL to keep links short and canonical. */
export const CATALOG_SEARCH_DEFAULTS = {
  tab: 'all',
  categories: [],
  networks: [],
  sort: 'recent',
  page: 1,
} satisfies Partial<CatalogSearch>;

export type CatalogSearchPatch = Partial<CatalogSearch>;

/**
 * Applies a partial change to the catalog state. Any change other than the page itself resets
 * pagination to the first page, as required for filters, search, tab and sort changes.
 */
export function applyCatalogSearchPatch(
  current: CatalogSearch,
  patch: CatalogSearchPatch,
): CatalogSearch {
  const changesOnlyPage = Object.keys(patch).every((key) => key === 'page');
  return { ...current, ...patch, page: changesOnlyPage ? (patch.page ?? current.page) : 1 };
}

/** Maps URL state to the API query contract. */
export function toCatalogQuery(search: CatalogSearch): CatalogQuery {
  return {
    search: search.q,
    tab: search.tab,
    categories: search.categories,
    networks: search.networks,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort,
    page: search.page,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

export function countActiveFilters(search: CatalogSearch): number {
  return (
    search.categories.length +
    search.networks.length +
    (search.minPrice !== undefined || search.maxPrice !== undefined ? 1 : 0)
  );
}

export const CATALOG_TAB_LABELS = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
} as const satisfies Record<CatalogSearch['tab'], string>;

export const CATALOG_SORT_LABELS = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A-Z)',
} as const satisfies Record<CatalogSearch['sort'], string>;
