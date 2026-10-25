import type {
  CategoryId,
  NetworkId,
  NftDetail,
  NftEdition,
  NftImage,
  Rarity,
} from '@/shared/contracts/nft';
import { addEth, multiplyEth } from '@/shared/lib/money';

import { createSeededRandom } from '../utils/random';

/**
 * Deterministic NFT catalog. The same seed always produces the same 48 items, so E2E tests and
 * visual baselines are stable. The first page (sorted by "recent") mirrors the Figma home frame.
 */

/** Fixed clock for fixtures: "new" listings and dates never drift between runs. */
export const MOCK_REFERENCE_DATE = new Date('2026-10-01T12:00:00.000Z');
export const NEW_LISTING_WINDOW_DAYS = 21;

type ArtworkId = 'emerald-ape' | 'sage-nomad' | 'ivory-baron' | 'golden-beat';

const ARTWORK_ALT: Record<ArtworkId, string> = {
  'emerald-ape':
    'Ilustração de um macaco marrom com óculos escuros redondos, jaqueta college verde e colar dourado',
  'sage-nomad':
    'Ilustração de um gorila grisalho com chapéu bucket verde-sálvia e moletom roxo com capuz',
  'ivory-baron':
    'Ilustração de um macaco de pelagem escura com blazer marfim e gola alta verde-escura',
  'golden-beat': 'Ilustração de um orangotango dourado com fones de ouvido verdes e jaqueta creme',
};

export function artworkImage(artwork: ArtworkId, alt = ARTWORK_ALT[artwork]): NftImage {
  return {
    alt,
    small: `/images/nfts/${artwork}-400.webp`,
    medium: `/images/nfts/${artwork}-800.webp`,
    large: `/images/nfts/${artwork}-1200.webp`,
  };
}

interface NftSeed {
  name: string;
  tokenNumber: number;
  artwork: ArtworkId;
  price: string;
  previousPrice?: string;
  rarity?: Rarity;
  category?: CategoryId;
  network?: NetworkId;
  isTrending?: boolean;
}

/** Items shown on the first catalog page of the Figma home frame, in display order. */
const FIGMA_SEEDS: NftSeed[] = [
  {
    name: 'Emerald Ape',
    tokenNumber: 42,
    artwork: 'emerald-ape',
    price: '1.19',
    category: 'digital-art',
    network: 'ethereum',
    isTrending: true,
  },
  {
    name: 'Sage Nomad',
    tokenNumber: 9,
    artwork: 'sage-nomad',
    price: '1.69',
    category: 'digital-art',
    network: 'ethereum',
  },
  {
    name: 'Neon Vessel',
    tokenNumber: 552,
    artwork: 'ivory-baron',
    price: '1.99',
    previousPrice: '2.29',
    rarity: 'rare',
    category: 'collectibles',
    network: 'polygon',
    isTrending: true,
  },
  {
    name: 'Cosmic Bloom',
    tokenNumber: 118,
    artwork: 'sage-nomad',
    price: '1.29',
    category: 'generative',
    network: 'ethereum',
  },
  {
    name: 'Violet Nomad',
    tokenNumber: 314,
    artwork: 'sage-nomad',
    price: '1.39',
    category: 'digital-art',
    network: 'polygon',
  },
  {
    name: 'Ivory Baron',
    tokenNumber: 88,
    artwork: 'ivory-baron',
    price: '1.79',
    category: 'collectibles',
    network: 'ethereum',
    isTrending: true,
  },
  {
    name: 'Golden Beat',
    tokenNumber: 207,
    artwork: 'golden-beat',
    price: '0.99',
    category: 'music',
    network: 'ethereum',
  },
  {
    name: 'Golden Pulse',
    tokenNumber: 233,
    artwork: 'golden-beat',
    price: '1.09',
    category: 'music',
    network: 'solana',
  },
  {
    name: 'Golden Signal',
    tokenNumber: 160,
    artwork: 'golden-beat',
    price: '0.39',
    category: 'music',
    network: 'polygon',
  },
];

const NAME_PREFIXES = [
  'Amber',
  'Velvet',
  'Copper',
  'Midnight',
  'Jade',
  'Rustic',
  'Lunar',
  'Solar',
  'Mossy',
  'Crimson',
  'Silent',
  'Hollow',
  'Prism',
  'Echo',
  'Saffron',
  'Onyx',
  'Quartz',
  'Cedar',
  'Nimbus',
  'Atlas',
];
const NAME_SUFFIXES = [
  'Monarch',
  'Drifter',
  'Oracle',
  'Wanderer',
  'Keeper',
  'Rebel',
  'Scholar',
  'Pilot',
  'Herald',
  'Voyager',
  'Sentinel',
  'Dreamer',
  'Mystic',
  'Ranger',
  'Courier',
];

const ARTWORKS: ArtworkId[] = ['emerald-ape', 'sage-nomad', 'ivory-baron', 'golden-beat'];
const CATEGORIES: CategoryId[] = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
];
const NETWORKS: NetworkId[] = ['ethereum', 'ethereum', 'polygon', 'solana'];

const COLLECTIONS = [
  { id: 'kurio-apes', name: 'Kurio Apes' },
  { id: 'kurio-editions', name: 'Kurio Editions' },
  { id: 'nova-sato', name: 'Nova Sato Studio' },
  { id: 'mint-journal', name: 'Mint Journal' },
] as const;

const ATTRIBUTES_BY_ARTWORK: Record<ArtworkId, string[]> = {
  'emerald-ape': ['Óculos', 'Esmeralda', 'Raro'],
  'sage-nomad': ['Chapéu bucket', 'Moletom', 'Sálvia'],
  'ivory-baron': ['Blazer', 'Gola alta', 'Marfim'],
  'golden-beat': ['Fones', 'Dourado', 'Ritmo'],
};

const TOTAL_ITEMS = 48;

function padToken(tokenNumber: number): string {
  return tokenNumber.toString().padStart(4, '0');
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildEditions(id: string, basePrice: string, random: () => number): NftEdition[] {
  const unique: NftEdition = {
    id: `${id}-1-1`,
    label: '1/1',
    kind: 'unique',
    supply: 1,
    available: random() > 0.75 ? 0 : 1,
    maxPerOrder: 1,
    price: multiplyEth(basePrice, '4'),
  };
  const ten: NftEdition = {
    id: `${id}-1-10`,
    label: '1/10',
    kind: 'limited',
    supply: 10,
    available: Math.floor(random() * 10),
    maxPerOrder: 3,
    price: multiplyEth(basePrice, '1.5'),
  };
  const fifty: NftEdition = {
    id: `${id}-1-50`,
    label: '1/50',
    kind: 'limited',
    supply: 50,
    available: 10 + Math.floor(random() * 40),
    maxPerOrder: 10,
    price: basePrice,
  };
  const open: NftEdition = {
    id: `${id}-open`,
    label: 'ABERTA',
    kind: 'open',
    supply: null,
    available: 999,
    maxPerOrder: 20,
    price: addEth(multiplyEth(basePrice, '0.5'), '0.01'),
  };
  return [unique, ten, fifty, open];
}

function buildNft(seed: NftSeed, index: number, random: () => number): NftDetail {
  const id = `${slugify(seed.name)}-${padToken(seed.tokenNumber)}`;
  const tokenId = `#${padToken(seed.tokenNumber)}`;
  const displayName = `${seed.name} #${padToken(seed.tokenNumber).slice(1)}`;
  const collection = COLLECTIONS[index % COLLECTIONS.length] ?? COLLECTIONS[0];
  const editions = buildEditions(id, seed.price, random);
  const listedAt = new Date(MOCK_REFERENCE_DATE.getTime() - index * 36 * 60 * 60 * 1000);
  const network = seed.network ?? NETWORKS[Math.floor(random() * NETWORKS.length)] ?? 'ethereum';
  const networkLabel = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }[network];
  const image = artworkImage(seed.artwork);

  return {
    id,
    tokenId,
    name: displayName,
    collection: { id: collection.id, name: collection.name },
    category:
      seed.category ?? CATEGORIES[Math.floor(random() * CATEGORIES.length)] ?? 'digital-art',
    network,
    image,
    price: seed.price,
    previousPrice: seed.previousPrice ?? null,
    rarity: seed.rarity ?? (random() > 0.85 ? 'rare' : 'common'),
    isTrending: seed.isTrending ?? random() > 0.7,
    isSoldOut: editions.every((edition) => edition.available === 0),
    listedAt: listedAt.toISOString(),
    rating: { average: Math.round((4 + random()) * 10) / 10, count: 5 + Math.floor(random() * 40) },
    version: 1,
    description: `Um colecionável digital 1/50 finalizado à mão da coleção ${collection.name}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${displayName} é uma obra digital 1/50 finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    attributes: ATTRIBUTES_BY_ARTWORK[seed.artwork],
    gallery: [image, image, image, image],
    editions,
    defaultEditionId: `${id}-1-50`,
    contract: {
      address: '0x7A42...19E8',
      standard: 'ERC-721',
      royaltyPercentage: 5,
      storage: `Cunhado na ${networkLabel} com procedência imutável e metadados armazenados no IPFS.`,
    },
  };
}

function generatedSeeds(random: () => number): NftSeed[] {
  const seeds: NftSeed[] = [];
  for (let index = FIGMA_SEEDS.length; index < TOTAL_ITEMS; index += 1) {
    const prefix = NAME_PREFIXES[index % NAME_PREFIXES.length] ?? 'Amber';
    const suffix = NAME_SUFFIXES[(index * 7) % NAME_SUFFIXES.length] ?? 'Monarch';
    // The first two generated items pin the price range shown in Figma (0.02 - 12.30 ETH).
    const randomCents = 2 + Math.floor(random() * 1228);
    const cents =
      index === FIGMA_SEEDS.length ? 2 : index === FIGMA_SEEDS.length + 1 ? 1230 : randomCents;
    seeds.push({
      name: `${prefix} ${suffix}`,
      tokenNumber: 300 + index * 13,
      artwork: ARTWORKS[index % ARTWORKS.length] ?? 'emerald-ape',
      price: (cents / 100).toFixed(2),
    });
  }
  return seeds;
}

export function createNftFixtures(seed = 20261001): NftDetail[] {
  const random = createSeededRandom(seed);
  const seeds = [...FIGMA_SEEDS, ...generatedSeeds(random)];
  return seeds.map((nftSeed, index) => buildNft(nftSeed, index, random));
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
};

export const NETWORK_LABELS: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
};
