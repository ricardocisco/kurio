import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/features/auth/hooks/use-session';
import { announce } from '@/shared/a11y/announce';
import type { Favorites } from '@/shared/contracts/favorites';
import type { NftSummary } from '@/shared/contracts/nft';

import { addFavorite, removeFavorite } from '../api/favorites.api';
import { favoritesQueryOptions } from '../api/favorites.queries';

export function useFavorites() {
  const { user } = useSession();
  const favorites = useQuery({
    ...favoritesQueryOptions(user?.id ?? 'guest'),
    enabled: Boolean(user),
  });

  const favoriteIds = useMemo(
    () => new Set(favorites.data?.items.map((item) => item.id) ?? []),
    [favorites.data],
  );

  return { userId: user?.id ?? null, favorites, favoriteIds };
}

interface ToggleFavoriteVariables {
  nft: NftSummary;
  shouldFavorite: boolean;
}

function applyToggle(
  current: Favorites | undefined,
  { nft, shouldFavorite }: ToggleFavoriteVariables,
): Favorites {
  const items = (current?.items ?? []).filter((item) => item.id !== nft.id);
  return { items: shouldFavorite ? [nft, ...items] : items };
}

export function useToggleFavorite(userId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = favoritesQueryOptions(userId);

  return useMutation({
    mutationKey: ['toggle-favorite', userId],
    mutationFn: ({ nft, shouldFavorite }: ToggleFavoriteVariables) =>
      shouldFavorite ? addFavorite(nft.id) : removeFavorite(nft.id),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, applyToggle(previous, variables));
      announce(
        variables.shouldFavorite
          ? `${variables.nft.name} adicionado à lista de interesse.`
          : `${variables.nft.name} removido da lista de interesse.`,
      );
      return { previous };
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error('Não foi possível atualizar seus favoritos.', {
        description: `${variables.nft.name} voltou ao estado anterior. Tente novamente.`,
      });
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['toggle-favorite', userId] }) === 1) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
