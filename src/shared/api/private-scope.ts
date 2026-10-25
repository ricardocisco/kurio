import type { QueryClient } from '@tanstack/react-query';

export const PRIVATE_QUERY_ROOT = 'private';

export function privateQueryKey<TParts extends readonly unknown[]>(
  userId: string,
  ...parts: TParts
) {
  return [PRIVATE_QUERY_ROOT, userId, ...parts] as const;
}

export function clearPrivateQueries(queryClient: QueryClient): void {
  void queryClient.cancelQueries({ queryKey: [PRIVATE_QUERY_ROOT] });
  queryClient.removeQueries({ queryKey: [PRIVATE_QUERY_ROOT] });
}
