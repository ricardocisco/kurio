import { getJson, sendJson } from '@/shared/api/http-client';
import {
  favoriteChangeSchema,
  favoritesSchema,
  type FavoriteChange,
  type Favorites,
} from '@/shared/contracts/favorites';

export function fetchFavorites(signal?: AbortSignal): Promise<Favorites> {
  return getJson('/me/favorites', favoritesSchema, { signal });
}

export function addFavorite(nftId: string): Promise<FavoriteChange> {
  return sendJson('put', `/me/favorites/${encodeURIComponent(nftId)}`, favoriteChangeSchema);
}

export function removeFavorite(nftId: string): Promise<FavoriteChange> {
  return sendJson('delete', `/me/favorites/${encodeURIComponent(nftId)}`, favoriteChangeSchema);
}
