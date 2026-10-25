import { Link } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';

import { QuantityStepper } from '@/shared/components/QuantityStepper';
import type { CartLine } from '@/shared/contracts/cart';
import { formatEth } from '@/shared/lib/money';

import { describeLineLimit, findIssue, lineQuantityLimit } from '../model/cart-line';

import { CartLineIssues } from './CartLineIssues';
import { useCartLineControls } from './use-cart-line-controls';

function LineThumbnail({ line, className }: { line: CartLine; className: string }) {
  return (
    <img
      src={line.image.small}
      alt=""
      width={400}
      height={400}
      loading="lazy"
      className={className}
    />
  );
}

function LineName({ line }: { line: CartLine }) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: line.nftId }}
      search={{ edition: line.editionId }}
      className="font-bold text-foreground transition-colors hover:text-primary"
    >
      {line.name}
    </Link>
  );
}

export function CartLineRow({ line }: { line: CartLine }) {
  const controls = useCartLineControls(line);
  const isSoldOut = Boolean(findIssue(line, 'sold-out'));

  return (
    <tr className="bg-card align-middle">
      <td className="py-3 pr-3 pl-3 lg:py-0 lg:pl-0">
        <div className="flex items-center gap-4">
          <LineThumbnail
            line={line}
            className="size-14 shrink-0 rounded-sm object-cover lg:size-[4.375rem] lg:rounded-none"
          />
          <div className="flex flex-col gap-0.5 text-sm lg:text-base">
            <LineName line={line} />
            <span className="text-xs text-primary lg:text-sm lg:text-muted-foreground">
              ID do token: {line.tokenId}
            </span>
            <span className="text-xs text-muted-foreground">Edição {line.editionLabel}</span>
          </div>
        </div>
        <div className="mt-2 empty:hidden">
          <CartLineIssues
            line={line}
            isUpdating={controls.isUpdating}
            onAcknowledgePrice={controls.acknowledgePrice}
            onFitStock={controls.setQuantity}
            onRemove={controls.remove}
          />
        </div>
      </td>
      <td className="px-3 text-sm font-bold whitespace-nowrap text-primary lg:text-base lg:text-muted-foreground">
        {formatEth(line.unitPrice)}
      </td>
      <td className="px-3">
        <QuantityStepper
          size="sm"
          label={`Quantidade de ${line.name}`}
          value={line.quantity}
          max={Math.max(line.quantity, lineQuantityLimit(line))}
          onChange={controls.setQuantity}
          disabled={controls.isUpdating || isSoldOut}
          limitMessage={describeLineLimit(line)}
        />
      </td>
      <td className="px-3 text-sm font-bold whitespace-nowrap text-primary lg:text-base">
        {formatEth(line.lineTotal)}
      </td>
      <td className="pr-3 pl-1 text-right">
        <button
          type="button"
          onClick={controls.remove}
          disabled={controls.isUpdating}
          aria-label={`Remover ${line.name} do carrinho`}
          className="flex size-8 items-center justify-center rounded-sm text-text-secondary transition-colors hover:text-destructive disabled:opacity-50"
        >
          <Trash2Icon className="size-4 lg:size-5" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

export function CartLineCard({ line }: { line: CartLine }) {
  const controls = useCartLineControls(line);
  const isSoldOut = Boolean(findIssue(line, 'sold-out'));

  return (
    <article className="flex flex-col gap-2">
      <div className="flex overflow-hidden rounded-xl bg-card">
        <LineThumbnail line={line} className="aspect-square w-24 shrink-0 object-cover" />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 p-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate text-sm">
              <LineName line={line} />
            </h3>
            <p className="text-xs text-muted-foreground">Edição: {line.editionLabel}</p>
            <p className="text-lg font-bold text-primary">{formatEth(line.lineTotal)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <QuantityStepper
              size="sm"
              label={`Quantidade de ${line.name}`}
              value={line.quantity}
              max={Math.max(line.quantity, lineQuantityLimit(line))}
              onChange={controls.setQuantity}
              disabled={controls.isUpdating || isSoldOut}
            />
            <button
              type="button"
              onClick={controls.remove}
              disabled={controls.isUpdating}
              aria-label={`Remover ${line.name} do carrinho`}
              className="flex size-7 items-center justify-center rounded-sm text-text-secondary transition-colors hover:text-destructive"
            >
              <Trash2Icon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {describeLineLimit(line) && (
        <p className="text-xs text-muted-foreground">{describeLineLimit(line)}</p>
      )}
      <CartLineIssues
        line={line}
        isUpdating={controls.isUpdating}
        onAcknowledgePrice={controls.acknowledgePrice}
        onFitStock={controls.setQuantity}
        onRemove={controls.remove}
      />
    </article>
  );
}
