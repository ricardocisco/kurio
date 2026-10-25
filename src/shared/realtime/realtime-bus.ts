import type { NftUpdatedEvent } from '@/shared/contracts/events';

type NftListener = (event: NftUpdatedEvent) => void;

const nftListeners = new Set<NftListener>();

export function onAcceptedNftUpdate(listener: NftListener): () => void {
  nftListeners.add(listener);
  return () => {
    nftListeners.delete(listener);
  };
}

export function notifyNftUpdate(event: NftUpdatedEvent): void {
  nftListeners.forEach((listener) => listener(event));
}
