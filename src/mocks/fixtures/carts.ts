import type { CartRecord } from '../db/database';

const SEEDED_AT = '2026-09-28T14:00:00.000Z';

export function createCartFixtures(): Record<string, CartRecord> {
  return {
    'user:user-nova': {
      id: 'cart-user-nova',
      lines: [
        {
          id: 'emerald-ape-0042:emerald-ape-0042-1-50',
          nftId: 'emerald-ape-0042',
          editionId: 'emerald-ape-0042-1-50',
          quantity: 2,
          priceAtAdd: '1.19',
        },
        {
          id: 'violet-nomad-0314:violet-nomad-0314-1-50',
          nftId: 'violet-nomad-0314',
          editionId: 'violet-nomad-0314-1-50',
          quantity: 6,
          priceAtAdd: '1.39',
        },
        {
          id: 'ivory-baron-0088:ivory-baron-0088-1-50',
          nftId: 'ivory-baron-0088',
          editionId: 'ivory-baron-0088-1-50',
          quantity: 9,
          priceAtAdd: '1.79',
        },
      ],
      couponCode: null,
      version: 1,
      updatedAt: SEEDED_AT,
    },
  };
}
