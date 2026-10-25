import type { NftDetail } from '@/shared/contracts/nft';
import { isEthAmount } from '@/shared/lib/money';

import { updateDatabase } from '../db/database';

interface EditionChange {
  nftId: string;
  editionId: string;
  price?: string;
  available?: number;
}

export function updateEdition(change: EditionChange): NftDetail {
  if (change.price !== undefined && !isEthAmount(change.price)) {
    throw new Error(`Invalid ETH amount ${JSON.stringify(change)}`);
  }
  if (
    change.available !== undefined &&
    (!Number.isInteger(change.available) || change.available < 0)
  ) {
    throw new Error(`Invalid availability "${String(change.available)}"`);
  }

  return updateDatabase((draft) => {
    const nft = draft.nfts.find((item) => item.id === change.nftId);
    const edition = nft?.editions.find((item) => item.id === change.editionId);
    if (!nft || !edition) throw new Error(`Unknown edition ${change.nftId}/${change.editionId}`);

    if (change.price !== undefined) edition.price = change.price;
    if (change.available !== undefined) edition.available = change.available;
    if (edition.id === nft.defaultEditionId) nft.price = edition.price;
    nft.isSoldOut = nft.editions.every((item) => item.available === 0);
    nft.version += 1;
    return structuredClone(nft);
  });
}
