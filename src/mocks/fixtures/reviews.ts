import type { NftDetail, NftReview } from '@/shared/contracts/nft';

import { createSeededRandom } from '../utils/random';

import { MOCK_REFERENCE_DATE } from './nfts';

/**
 * Reviews are derived deterministically from the NFT id and its rating summary, so the review list
 * always matches `rating.count` and `rating.average` without storing hundreds of records.
 */

const AUTHORS = [
  'Ana Ribeiro',
  'Bruno Tanaka',
  'Carla Mendes',
  'Diego Alves',
  'Elisa Prado',
  'Felipe Rocha',
  'Gabriela Lins',
  'Henrique Sá',
  'Isabela Duarte',
  'João Pires',
  'Karen Matos',
  'Lucas Nery',
];

const COMMENTS_BY_RATING: Record<number, string[]> = {
  5: [
    'A arte em alta resolução é impecável. Valeu cada ETH.',
    'Procedência verificada e entrega imediata na carteira. Recomendo.',
    'Uma das peças favoritas da minha coleção. Detalhes incríveis.',
  ],
  4: [
    'Obra linda, só senti falta de mais conteúdo desbloqueável.',
    'Ótima edição, a comunidade da coleção é muito ativa.',
  ],
  3: ['Gostei da arte, mas esperava mais utilidade para colecionadores.'],
  2: ['A taxa de rede no dia da compra estava alta.'],
  1: ['Não era bem o estilo que eu procurava.'],
};

function hashId(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildReviews(nft: Pick<NftDetail, 'id' | 'rating'>): NftReview[] {
  const random = createSeededRandom(hashId(nft.id));
  const average = nft.rating.average;

  return Array.from({ length: nft.rating.count }, (_, index) => {
    const deviation = random() < 0.7 ? 0 : random() < 0.5 ? -1 : 1;
    const rating = Math.min(5, Math.max(1, Math.round(average) + deviation));
    const comments = COMMENTS_BY_RATING[rating] ?? COMMENTS_BY_RATING[5] ?? [];
    const createdAt = new Date(MOCK_REFERENCE_DATE.getTime() - (index + 1) * 26 * 60 * 60 * 1000);

    return {
      id: `${nft.id}-review-${index + 1}`,
      authorName: AUTHORS[Math.floor(random() * AUTHORS.length)] ?? 'Colecionador',
      rating,
      comment: comments[Math.floor(random() * comments.length)] ?? '',
      createdAt: createdAt.toISOString(),
    };
  });
}
