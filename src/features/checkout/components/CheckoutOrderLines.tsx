import type { PurchaseLine } from '@/shared/contracts/checkout';
import type { CartSummary } from '@/shared/contracts/cart';
import { cn } from '@/shared/lib/cn';
import { formatEth, isZeroEth } from '@/shared/lib/money';

interface LineLike {
  lineId?: string;
  id?: string;
  name: string;
  tokenId: string;
  image: PurchaseLine['image'];
  quantity: number;
  lineTotal: string;
}

export function CheckoutOrderLines({
  lines,
  changedLineIds = [],
}: {
  lines: LineLike[];
  changedLineIds?: string[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line) => {
        const id = line.lineId ?? line.id ?? line.name;
        return (
          <li
            key={id}
            className={cn(
              'flex items-center gap-3 rounded-sm bg-card p-2',
              changedLineIds.includes(id) && 'ring-1 ring-warning',
            )}
          >
            <img
              src={line.image.small}
              alt=""
              width={400}
              height={400}
              className="size-11 rounded-sm object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col text-xs">
              <span className="truncate font-bold text-foreground">{line.name}</span>
              <span className="truncate text-primary">ID do token: {line.tokenId}</span>
            </div>
            <span className="text-xs text-text-secondary">(x {line.quantity})</span>
            <span className="w-24 text-right text-sm font-bold text-primary">
              {formatEth(line.lineTotal)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function CheckoutTotals({
  summary,
  couponCode,
}: {
  summary: CartSummary;
  couponCode?: string | null;
}) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatEth(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>{couponCode ? `Desconto (${couponCode})` : 'Desconto do lançamento'}</dt>
        <dd className="tabular-nums">
          {isZeroEth(summary.discount) ? '(-) 0.00' : `(-) ${formatEth(summary.discount)}`}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt>Taxa de rede</dt>
        <dd className="flex flex-col items-end tabular-nums">
          {formatEth(summary.networkFee, { minimumFractionDigits: 3 })}
          <span className="text-[0.6875rem] text-primary">Taxa estimada</span>
        </dd>
      </div>
      <div className="flex justify-between border-t border-primary/50 pt-2 font-bold">
        <dt>Total</dt>
        <dd className="text-base text-primary tabular-nums">
          {formatEth(summary.total, { minimumFractionDigits: 3 })}
        </dd>
      </div>
    </dl>
  );
}
