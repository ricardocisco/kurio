import { queryOptions } from '@tanstack/react-query';

import { privateQueryKey } from '@/shared/api/private-scope';

import { fetchWallets } from './wallets.api';

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'wallets'),
    queryFn: ({ signal }) => fetchWallets(signal),
  });
}
