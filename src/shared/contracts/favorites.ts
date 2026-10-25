import { z } from 'zod';

import { nftSummarySchema } from './nft';

export const favoritesSchema = z.object({ items: z.array(nftSummarySchema) });
export type Favorites = z.infer<typeof favoritesSchema>;

export const favoriteChangeSchema = z.object({
  nftId: z.string(),
  isFavorite: z.boolean(),
});
export type FavoriteChange = z.infer<typeof favoriteChangeSchema>;
