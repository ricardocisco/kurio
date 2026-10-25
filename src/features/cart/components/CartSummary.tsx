import { Link } from '@tanstack/react-router';

import type { Cart } from '@/shared/contracts/cart';
import { cn } from '@/shared/lib/cn';
import { formatEth, isZeroEth } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { CouponForm } from './CouponForm';

interface CartSummaryProps {
  cart: Cart;
  variant: 'panel' | 'sheet';
  isUpdating: boolean;
}

function SummaryRow({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 text-sm', emphasis && 'font-bold')}>
      <dt>{label}</dt>
      <dd className="flex flex-col items-end">
        <span className={cn('tabular-nums', emphasis && 'text-base text-primary')}>{value}</span>
        {hint && <span className="text-[0.6875rem] font-normal text-primary">{hint}</span>}
      </dd>
    </div>
  );
}

export function CartSummary({ cart, variant, isUpdating }: CartSummaryProps) {
  const { summary } = cart;
  const isEmpty = cart.lines.length === 0;
  const blockedReason = isEmpty
    ? 'Adicione um NFT para finalizar.'
    : cart.hasBlockingIssues
      ? 'Resolva os avisos de disponibilidade para finalizar.'
      : undefined;

  return (
    <section
      aria-labelledby="cart-summary-title"
      className={cn(
        'flex flex-col gap-4',
        variant === 'sheet' &&
          'rounded-t-3xl bg-card px-5 pt-6 pb-8 shadow-[0_-8px_24px_rgb(0_0_0/0.35)]',
      )}
    >
      <h2
        id="cart-summary-title"
        className={cn(
          'border-b border-primary/50 pb-2 text-sm font-bold',
          variant === 'sheet' && 'sr-only',
        )}
      >
        Resumo da carteira
      </h2>
      <CouponForm
        coupon={cart.coupon}
        variant={variant === 'sheet' ? 'pill' : 'panel'}
        disabled={isEmpty}
      />
      <dl className="flex flex-col gap-3" aria-busy={isUpdating}>
        <SummaryRow label="Subtotal" value={formatEth(summary.subtotal)} />
        <SummaryRow
          label={cart.coupon ? `Desconto (${cart.coupon.code})` : 'Desconto do lançamento'}
          value={isZeroEth(summary.discount) ? '(-) 0.00' : `(-) ${formatEth(summary.discount)}`}
        />
        <SummaryRow
          label="Taxa de rede"
          value={formatEth(summary.networkFee, { minimumFractionDigits: 3 })}
          hint="Taxa estimada"
        />
        <SummaryRow
          label="Total"
          value={formatEth(summary.total, { minimumFractionDigits: 3 })}
          emphasis
        />
      </dl>
      <p className="sr-only" aria-live="polite">
        {isUpdating ? 'Atualizando resumo…' : `Total do carrinho: ${formatEth(summary.total)}`}
      </p>
      {blockedReason && <p className="text-xs text-muted-foreground">{blockedReason}</p>}
      {blockedReason ? (
        <Button
          variant={variant === 'sheet' ? 'gradient' : 'primary'}
          size={variant === 'sheet' ? 'pill' : 'md'}
          disabled
        >
          Conectar e finalizar
        </Button>
      ) : (
        <Button
          asChild
          variant={variant === 'sheet' ? 'gradient' : 'primary'}
          size={variant === 'sheet' ? 'pill' : 'md'}
        >
          <Link to="/checkout">Conectar e finalizar</Link>
        </Button>
      )}
      {variant === 'panel' && (
        <Link to="/marketplace" className="text-center text-xs text-primary hover:underline">
          Continuar explorando
        </Link>
      )}
    </section>
  );
}

export function CartSummarySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
