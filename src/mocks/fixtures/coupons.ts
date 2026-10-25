export interface CouponRecord {
  code: string;
  description: string;
  percentage: number;
  expiresAt: string;
}

export const COUPONS: CouponRecord[] = [
  {
    code: 'KURIO10',
    description: '10% de desconto do lançamento',
    percentage: 10,
    expiresAt: '2030-12-31T23:59:59.000Z',
  },
  {
    code: 'GENESIS5',
    description: '5% de desconto em edições gênesis',
    percentage: 5,
    expiresAt: '2030-12-31T23:59:59.000Z',
  },
  {
    code: 'VERAO25',
    description: '25% de desconto de verão',
    percentage: 25,
    expiresAt: '2025-03-01T00:00:00.000Z',
  },
];

export function findCoupon(code: string): CouponRecord | undefined {
  return COUPONS.find((coupon) => coupon.code === code.trim().toUpperCase());
}

export function isCouponExpired(coupon: CouponRecord): boolean {
  return new Date(coupon.expiresAt).getTime() <= Date.now();
}
