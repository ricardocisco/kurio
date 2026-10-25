import type { NftDetail, NftEdition } from '@/shared/contracts/nft';

export function isEditionAvailable(edition: NftEdition): boolean {
  return edition.available > 0;
}

/**
 * Picks the edition to display: the requested one (even if sold out, so the user sees why it is
 * unavailable), otherwise the default edition if available, otherwise the first available one.
 */
export function resolveSelectedEdition(
  nft: NftDetail,
  requestedId: string | undefined,
): NftEdition {
  const requested = nft.editions.find((edition) => edition.id === requestedId);
  if (requested) return requested;

  const defaultEdition = nft.editions.find((edition) => edition.id === nft.defaultEditionId);
  if (defaultEdition && isEditionAvailable(defaultEdition)) return defaultEdition;

  return nft.editions.find(isEditionAvailable) ?? defaultEdition ?? nft.editions[0]!;
}

export interface QuantityLimit {
  max: number;
  /** What caps the quantity: remaining stock or the per-order rule. */
  reason: 'stock' | 'per-order';
}

export function getQuantityLimit(edition: NftEdition): QuantityLimit {
  return edition.available < edition.maxPerOrder
    ? { max: edition.available, reason: 'stock' }
    : { max: edition.maxPerOrder, reason: 'per-order' };
}

export function clampQuantity(quantity: number, limit: QuantityLimit): number {
  if (limit.max <= 0) return 0;
  return Math.min(Math.max(1, Math.trunc(quantity)), limit.max);
}

export function describeQuantityLimit(limit: QuantityLimit): string {
  if (limit.max <= 0) return 'Edição esgotada.';
  if (limit.reason === 'stock') {
    return limit.max === 1
      ? 'Apenas 1 unidade disponível.'
      : `Apenas ${limit.max} unidades disponíveis.`;
  }
  return `Máximo de ${limit.max} por pedido.`;
}

export function describeEditionAvailability(edition: NftEdition): string {
  if (edition.available === 0) return 'Esgotada';
  if (edition.supply === null) return 'Edição aberta';
  return `${edition.available} de ${edition.supply} disponíveis`;
}
