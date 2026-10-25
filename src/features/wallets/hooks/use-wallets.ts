import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { announce } from '@/shared/a11y/announce';
import type { Wallet, Wallets } from '@/shared/contracts/wallets';

import { removeSecondaryWallet, savePrimaryWallet, saveSecondaryWallet } from '../api/wallets.api';
import { walletsQueryOptions } from '../api/wallets.queries';

export function useWallets(userId: string) {
  return useQuery(walletsQueryOptions(userId));
}

function upsert(current: Wallets | undefined, wallet: Wallet): Wallets {
  const others = (current?.items ?? []).filter((item) => item.role !== wallet.role);
  return { items: [...others, wallet].sort((a) => (a.role === 'primary' ? -1 : 1)) };
}

function useWalletCache(userId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = walletsQueryOptions(userId);
  return {
    write: (wallet: Wallet) =>
      queryClient.setQueryData(queryKey, (current) => upsert(current, wallet)),
    removeSecondary: () =>
      queryClient.setQueryData(queryKey, (current) => ({
        items: (current?.items ?? []).filter((item) => item.role !== 'secondary'),
      })),
  };
}

export function useSavePrimaryWallet(userId: string) {
  const cache = useWalletCache(userId);
  return useMutation({
    mutationFn: savePrimaryWallet,
    onSuccess: (wallet) => {
      cache.write(wallet);
      announce('Carteira principal salva.');
    },
  });
}

export function useSaveSecondaryWallet(userId: string) {
  const cache = useWalletCache(userId);
  return useMutation({
    mutationFn: saveSecondaryWallet,
    onSuccess: (wallet) => {
      cache.write(wallet);
      announce('Carteira secundária salva.');
    },
  });
}

export function useRemoveSecondaryWallet(userId: string) {
  const cache = useWalletCache(userId);
  return useMutation({
    mutationFn: removeSecondaryWallet,
    onSuccess: () => {
      cache.removeSecondary();
      announce('Carteira secundária removida.');
    },
  });
}
