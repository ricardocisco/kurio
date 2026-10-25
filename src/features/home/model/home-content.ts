import type { NftImage } from '@/shared/contracts/nft';

/**
 * Static editorial content from the Figma home frame. Editorial pages are out of the challenge
 * scope, so this copy is not fetched from the API and its "read more" actions are not navigable.
 */

const image = (artwork: string, alt: string): NftImage => ({
  alt,
  small: `/images/nfts/${artwork}-400.webp`,
  medium: `/images/nfts/${artwork}-800.webp`,
  large: `/images/nfts/${artwork}-1200.webp`,
});

export interface PromoBanner {
  title: string;
  description: string;
  image: NftImage;
  target: 'new-releases' | 'digital-art';
}

export const PROMO_BANNERS: PromoBanner[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: image('emerald-ape', ''),
    target: 'new-releases',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: image('ivory-baron', ''),
    target: 'digital-art',
  },
];

export interface JournalArticle {
  id: string;
  date: string;
  readingMinutes: number;
  title: string;
  excerpt: string;
  image: NftImage;
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    id: 'how-nft-ownership-works',
    date: '2026-09-12',
    readingMinutes: 6,
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: image('ivory-baron', ''),
  },
  {
    id: 'ten-digital-artists',
    date: '2026-09-13',
    readingMinutes: 2,
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: image('emerald-ape', ''),
  },
  {
    id: 'rarity-attributes-provenance',
    date: '2026-09-15',
    readingMinutes: 3,
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: image('sage-nomad', ''),
  },
  {
    id: 'how-to-protect-your-wallet',
    date: '2026-09-15',
    readingMinutes: 2,
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja seus ativos e sua identidade.',
    image: image('golden-beat', ''),
  },
];
