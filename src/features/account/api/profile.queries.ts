import { queryOptions } from '@tanstack/react-query';

import { privateQueryKey } from '@/shared/api/private-scope';

import { fetchProfile } from './account.api';

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'profile'),
    queryFn: ({ signal }) => fetchProfile(signal),
  });
}
