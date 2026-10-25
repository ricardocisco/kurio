import { queryOptions } from '@tanstack/react-query';

import { privateQueryKey } from '@/shared/api/private-scope';

import { fetchFavorites } from './favorites.api';

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'favorites'),
    queryFn: ({ signal }) => fetchFavorites(signal),
  });
}
