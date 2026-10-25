import { http } from 'msw';

import type { FavoriteChange, Favorites } from '@/shared/contracts/favorites';
import type { NftDetail } from '@/shared/contracts/nft';

import { readDatabase, updateDatabase } from '../db/database';
import { apiPath } from '../utils/api-path';
import { authenticate } from '../utils/auth';
import { toNftSummary } from '../utils/projections';
import { errorResponse, jsonResponse } from '../utils/responses';

function findNft(nftId: string): NftDetail | undefined {
  return readDatabase().nfts.find((nft) => nft.id === nftId);
}

export const favoritesHandlers = [
  http.get(apiPath('/me/favorites'), ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;

    const records = readDatabase().favorites[auth.user.id] ?? [];
    const items = [...records]
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .map((record) => findNft(record.nftId))
      .filter((nft): nft is NftDetail => Boolean(nft))
      .map(toNftSummary);

    return jsonResponse<Favorites>({ items });
  }),

  http.put<{ nftId: string }>(apiPath('/me/favorites/:nftId'), ({ request, params }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    if (!findNft(params.nftId)) return errorResponse('NOT_FOUND', 'NFT não encontrado.');

    updateDatabase((draft) => {
      const records = draft.favorites[auth.user.id] ?? [];
      if (!records.some((record) => record.nftId === params.nftId)) {
        records.push({ nftId: params.nftId, addedAt: new Date().toISOString() });
      }
      draft.favorites[auth.user.id] = records;
    });
    return jsonResponse<FavoriteChange>({ nftId: params.nftId, isFavorite: true });
  }),

  http.delete<{ nftId: string }>(apiPath('/me/favorites/:nftId'), ({ request, params }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;

    updateDatabase((draft) => {
      draft.favorites[auth.user.id] = (draft.favorites[auth.user.id] ?? []).filter(
        (record) => record.nftId !== params.nftId,
      );
    });
    return jsonResponse<FavoriteChange>({ nftId: params.nftId, isFavorite: false });
  }),
];
