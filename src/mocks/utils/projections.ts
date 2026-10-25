import type { NftDetail, NftSummary } from '@/shared/contracts/nft';

export function toNftSummary(nft: NftDetail): NftSummary {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    collection: nft.collection,
    category: nft.category,
    network: nft.network,
    image: nft.image,
    price: nft.price,
    previousPrice: nft.previousPrice,
    rarity: nft.rarity,
    isTrending: nft.isTrending,
    isSoldOut: nft.isSoldOut,
    listedAt: nft.listedAt,
    rating: nft.rating,
    version: nft.version,
  };
}
