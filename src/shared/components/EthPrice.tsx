import { formatEth, type EthAmount } from '@/shared/lib/money';
import { cn } from '@/shared/lib/cn';

interface EthPriceProps {
  value: EthAmount;
  previousValue?: EthAmount | null;
  className?: string;
}

/** Price in ETH with an optional struck-through previous price (announced to screen readers). */
export function EthPrice({ value, previousValue, className }: EthPriceProps) {
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 font-bold text-primary', className)}>
      <span>
        {previousValue && <span className="sr-only">Preço atual: </span>}
        {formatEth(value)}
      </span>
      {previousValue && (
        <s className="font-normal text-muted-foreground">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(previousValue)}
        </s>
      )}
    </p>
  );
}
