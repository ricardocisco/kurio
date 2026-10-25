import type { Cart, CartLine, CartLineIssue, CartNotice } from '@/shared/contracts/cart';
import type { NftDetail, NftEdition } from '@/shared/contracts/nft';
import {
  addEth,
  isEthEqual,
  multiplyEth,
  percentageOfEth,
  subtractEth,
  ZERO_ETH,
} from '@/shared/lib/money';

import type { CartRecord } from '../db/database';
import { findCoupon, isCouponExpired } from '../fixtures/coupons';

export const BASE_NETWORK_FEE = '0.01';
export const NETWORK_FEE_PER_LINE = '0.002';

export function maxAllowedQuantity(edition: NftEdition): number {
  return Math.min(edition.available, edition.maxPerOrder);
}

export function findEdition(
  nfts: readonly NftDetail[],
  nftId: string,
  editionId: string,
): { nft: NftDetail; edition: NftEdition } | null {
  const nft = nfts.find((item) => item.id === nftId);
  const edition = nft?.editions.find((item) => item.id === editionId);
  return nft && edition ? { nft, edition } : null;
}

export function networkFeeFor(lineCount: number): string {
  if (lineCount === 0) return ZERO_ETH;
  return addEth(BASE_NETWORK_FEE, multiplyEth(NETWORK_FEE_PER_LINE, lineCount));
}

export function emptyCartRecord(id: string): CartRecord {
  return { id, lines: [], couponCode: null, version: 1, updatedAt: new Date().toISOString() };
}

export function buildCart(
  record: CartRecord,
  nfts: readonly NftDetail[],
  notices: CartNotice[] = [],
): Cart {
  const lines: CartLine[] = record.lines.flatMap((line) => {
    const found = findEdition(nfts, line.nftId, line.editionId);
    if (!found) return [];
    const { nft, edition } = found;

    const issues: CartLineIssue[] = [];
    if (edition.available === 0) issues.push({ type: 'sold-out' });
    else if (line.quantity > edition.available) {
      issues.push({ type: 'insufficient-stock', available: edition.available });
    }
    if (!isEthEqual(line.priceAtAdd, edition.price)) {
      issues.push({ type: 'price-changed', previousUnitPrice: line.priceAtAdd });
    }

    return [
      {
        id: line.id,
        nftId: nft.id,
        editionId: edition.id,
        name: nft.name,
        tokenId: nft.tokenId,
        editionLabel: edition.label,
        image: nft.image,
        unitPrice: edition.price,
        quantity: line.quantity,
        lineTotal: multiplyEth(edition.price, line.quantity),
        available: edition.available,
        maxPerOrder: edition.maxPerOrder,
        issues,
      },
    ];
  });

  const coupon = record.couponCode ? findCoupon(record.couponCode) : undefined;
  const activeCoupon = coupon && !isCouponExpired(coupon) ? coupon : undefined;
  const subtotal = addEth(...lines.map((line) => line.lineTotal));
  const discount = activeCoupon ? percentageOfEth(subtotal, activeCoupon.percentage) : ZERO_ETH;
  const networkFee = networkFeeFor(lines.length);

  return {
    id: record.id,
    lines,
    coupon: activeCoupon
      ? {
          code: activeCoupon.code,
          description: activeCoupon.description,
          percentage: activeCoupon.percentage,
        }
      : null,
    summary: {
      itemCount: lines.reduce((count, line) => count + line.quantity, 0),
      subtotal,
      discount,
      networkFee,
      total: addEth(subtractEth(subtotal, discount), networkFee),
    },
    notices,
    hasBlockingIssues: lines.some((line) =>
      line.issues.some((issue) => issue.type === 'sold-out' || issue.type === 'insufficient-stock'),
    ),
    version: record.version,
    updatedAt: record.updatedAt,
  };
}
