import { z } from 'zod';

import {
  ethAmountSchema,
  isoDateTimeSchema,
  nonNegativeIntSchema,
  paginatedSchema,
  positiveIntSchema,
} from './common';

export const networkIdSchema = z.enum(['ethereum', 'polygon', 'solana']);
export type NetworkId = z.infer<typeof networkIdSchema>;

export const categoryIdSchema = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
]);
export type CategoryId = z.infer<typeof categoryIdSchema>;

export const raritySchema = z.enum(['common', 'rare', 'legendary']);
export type Rarity = z.infer<typeof raritySchema>;

export const nftImageSchema = z.object({
  alt: z.string(),
  /** Responsive sources: ~400px, ~800px and ~1200px wide. */
  small: z.string(),
  medium: z.string(),
  large: z.string(),
});
export type NftImage = z.infer<typeof nftImageSchema>;

export const editionKindSchema = z.enum(['unique', 'limited', 'open']);
export type EditionKind = z.infer<typeof editionKindSchema>;

export const nftEditionSchema = z.object({
  id: z.string(),
  /** Label as displayed in the design, e.g. "1/1", "1/10", "1/50", "ABERTA". */
  label: z.string(),
  kind: editionKindSchema,
  /** Total supply; `null` for open editions. */
  supply: positiveIntSchema.nullable(),
  available: nonNegativeIntSchema,
  maxPerOrder: positiveIntSchema,
  price: ethAmountSchema,
});
export type NftEdition = z.infer<typeof nftEditionSchema>;

export const nftSummarySchema = z.object({
  id: z.string(),
  tokenId: z.string(),
  name: z.string(),
  collection: z.object({ id: z.string(), name: z.string() }),
  category: categoryIdSchema,
  network: networkIdSchema,
  image: nftImageSchema,
  /** Price of the default edition (the one pre-selected on the detail page). */
  price: ethAmountSchema,
  /** Previous price when the item is discounted; rendered struck-through. */
  previousPrice: ethAmountSchema.nullable(),
  rarity: raritySchema,
  isTrending: z.boolean(),
  isSoldOut: z.boolean(),
  listedAt: isoDateTimeSchema,
  rating: z.object({ average: z.number().min(0).max(5), count: nonNegativeIntSchema }),
  /** Monotonic version used to reconcile REST data with realtime events. */
  version: positiveIntSchema,
});
export type NftSummary = z.infer<typeof nftSummarySchema>;

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  story: z.array(z.string()),
  attributes: z.array(z.string()),
  gallery: z.array(nftImageSchema).min(1),
  editions: z.array(nftEditionSchema).min(1),
  defaultEditionId: z.string(),
  contract: z.object({
    address: z.string(),
    standard: z.string(),
    royaltyPercentage: z.number().nonnegative(),
    storage: z.string(),
  }),
});
export type NftDetail = z.infer<typeof nftDetailSchema>;

/* ------------------------------------------------------------------------------------------------
 * Catalog listing
 * ---------------------------------------------------------------------------------------------- */

export const catalogTabSchema = z.enum(['all', 'new', 'trending']);
export type CatalogTab = z.infer<typeof catalogTabSchema>;

export const catalogSortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'name-asc']);
export type CatalogSort = z.infer<typeof catalogSortSchema>;

export const CATALOG_PAGE_SIZE = 9;

/** Comma-separated list in the query string, e.g. `?categories=music,gaming`. */
function csvListSchema<TItem extends z.ZodType<string, string>>(item: TItem) {
  return z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').filter(Boolean) : []))
    .pipe(z.array(item));
}

/**
 * Query string accepted by `GET /nfts`. The API (MSW handler) validates incoming requests with this
 * schema and the client builds its params from the output type, so both sides share one contract.
 */
export const catalogQueryParamsSchema = z.object({
  search: z.string().trim().max(80).optional(),
  tab: catalogTabSchema.default('all'),
  categories: csvListSchema(categoryIdSchema),
  networks: csvListSchema(networkIdSchema),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  sort: catalogSortSchema.default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(CATALOG_PAGE_SIZE),
});

export type CatalogQuery = z.output<typeof catalogQueryParamsSchema>;

export const facetOptionSchema = <TId extends z.ZodType>(id: TId) =>
  z.object({ id, label: z.string(), count: nonNegativeIntSchema });

export const catalogFacetsSchema = z.object({
  categories: z.array(facetOptionSchema(categoryIdSchema)),
  networks: z.array(facetOptionSchema(networkIdSchema)),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
});
export type CatalogFacets = z.infer<typeof catalogFacetsSchema>;

export const catalogPageSchema = paginatedSchema(nftSummarySchema).extend({
  facets: catalogFacetsSchema,
});
export type CatalogPage = z.infer<typeof catalogPageSchema>;

export const featuredNftsSchema = z.object({
  heroSlides: z.array(nftSummarySchema).min(1),
  spotlight: nftSummarySchema,
});
export type FeaturedNfts = z.infer<typeof featuredNftsSchema>;

/* ------------------------------------------------------------------------------------------------
 * Detail page: reviews and related items
 * ---------------------------------------------------------------------------------------------- */

export const NFT_REVIEWS_PAGE_SIZE = 5;

export const nftReviewSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: isoDateTimeSchema,
});
export type NftReview = z.infer<typeof nftReviewSchema>;

export const nftReviewsPageSchema = paginatedSchema(nftReviewSchema);
export type NftReviewsPage = z.infer<typeof nftReviewsPageSchema>;

export const relatedNftsSchema = z.object({ items: z.array(nftSummarySchema) });
export type RelatedNfts = z.infer<typeof relatedNftsSchema>;
