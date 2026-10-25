import type { CartLine } from '@/shared/contracts/cart';
import { formatEth } from '@/shared/lib/money';

import { findIssue } from '../model/cart-line';

interface CartLineIssuesProps {
  line: CartLine;
  isUpdating: boolean;
  onAcknowledgePrice: () => void;
  onFitStock: (available: number) => void;
  onRemove: () => void;
}

const issueClass = 'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm px-3 py-2 text-xs';
const actionClass = 'font-bold text-primary underline-offset-4 hover:underline disabled:opacity-60';

export function CartLineIssues({
  line,
  isUpdating,
  onAcknowledgePrice,
  onFitStock,
  onRemove,
}: CartLineIssuesProps) {
  const priceChanged = findIssue(line, 'price-changed');
  const insufficientStock = findIssue(line, 'insufficient-stock');
  const soldOut = findIssue(line, 'sold-out');
  if (!priceChanged && !insufficientStock && !soldOut) return null;

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label={`Avisos sobre ${line.name}`}>
      {priceChanged && (
        <p className={`${issueClass} border border-warning/50 text-warning`}>
          <span>
            O preço mudou de {formatEth(priceChanged.previousUnitPrice)} para{' '}
            {formatEth(line.unitPrice)}.
          </span>
          <button
            type="button"
            className={actionClass}
            disabled={isUpdating}
            onClick={onAcknowledgePrice}
          >
            Entendi
          </button>
        </p>
      )}
      {insufficientStock && (
        <p className={`${issueClass} border border-destructive/60 text-destructive`}>
          <span>
            {insufficientStock.available === 1
              ? 'Resta apenas 1 unidade desta edição.'
              : `Restam apenas ${insufficientStock.available} unidades desta edição.`}
          </span>
          <button
            type="button"
            className={actionClass}
            disabled={isUpdating}
            onClick={() => onFitStock(insufficientStock.available)}
          >
            Ajustar quantidade
          </button>
        </p>
      )}
      {soldOut && (
        <p className={`${issueClass} border border-destructive/60 text-destructive`}>
          <span>Esta edição esgotou.</span>
          <button type="button" className={actionClass} disabled={isUpdating} onClick={onRemove}>
            Remover do carrinho
          </button>
        </p>
      )}
    </div>
  );
}
