import type { CartLine, CartLineIssue } from '@/shared/contracts/cart';

export function lineQuantityLimit(line: CartLine): number {
  return Math.max(1, Math.min(line.available, line.maxPerOrder));
}

export function findIssue<TType extends CartLineIssue['type']>(
  line: CartLine,
  type: TType,
): Extract<CartLineIssue, { type: TType }> | undefined {
  return line.issues.find(
    (issue): issue is Extract<CartLineIssue, { type: TType }> => issue.type === type,
  );
}

export function describeLineLimit(line: CartLine): string | undefined {
  if (line.quantity < lineQuantityLimit(line)) return undefined;
  if (line.available < line.maxPerOrder) {
    return line.available === 1
      ? 'Apenas 1 unidade disponível.'
      : `Apenas ${line.available} unidades disponíveis.`;
  }
  return `Máximo de ${line.maxPerOrder} por pedido.`;
}
