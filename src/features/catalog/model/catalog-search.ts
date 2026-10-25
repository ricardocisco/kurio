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

export const CATALOG_SEARCH_DEFAULTS = {
  tab: 'all',
  categories: [],
  networks: [],
  sort: 'recent',
  page: 1,
} satisfies Partial<CatalogSearch>;

export type CatalogSearchPatch = Partial<CatalogSearch>;

export function applyCatalogSearchPatch(
  current: CatalogSearch,
  patch: CatalogSearchPatch,
): CatalogSearch {
  const changesOnlyPage = Object.keys(patch).every((key) => key === 'page');
  return { ...current, ...patch, page: changesOnlyPage ? (patch.page ?? current.page) : 1 };
}

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
