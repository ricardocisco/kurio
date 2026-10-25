import { ExternalLinkIcon } from 'lucide-react';

import type { Order } from '@/shared/contracts/orders';
import { shortenAddress, WALLET_PROVIDER_LABELS } from '@/shared/contracts/wallets';
import { formatEth } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';

import { ThankYouMark } from './ThankYouMark';

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const;
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function OrderReceipt({
  order,
}: {
  order: Order & { transaction: NonNullable<Order['transaction']> };
}) {
  const facts = [
    { label: 'ID da transação', value: shortenAddress(order.transaction.hash) },
    { label: 'Data', value: dateFormatter.format(new Date(order.transaction.confirmedAt)) },
    { label: 'Total', value: formatEth(order.summary.total, { minimumFractionDigits: 3 }) },
    { label: 'Carteira', value: WALLET_PROVIDER_LABELS[order.wallet.provider] },
  ];

  return (
    <article
      aria-labelledby="receipt-title"
      className="mx-auto flex w-full max-w-xl flex-col border-b-[6px] border-b-primary bg-card"
    >
      <header className="flex flex-col items-center gap-3 px-6 pt-8 pb-5 text-center">
        <ThankYouMark />
        <h1 id="receipt-title" className="text-base font-bold text-primary">
          Seus NFTs agora estão na sua carteira
        </h1>
        <p className="text-xs text-text-secondary">Pedido {order.id}</p>
      </header>

      <dl className="grid grid-cols-2 gap-y-3 border-y border-primary/60 px-6 py-4 text-xs sm:grid-cols-4">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={index > 0 ? 'sm:border-l sm:border-primary/60 sm:pl-3' : undefined}
          >
            <dt className="font-bold">{fact.label}</dt>
            <dd className="text-text-secondary">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="receipt-items-title" className="flex flex-col gap-3 px-6 py-5">
        <h2 id="receipt-items-title" className="text-sm font-bold">
          Detalhes da transação
        </h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left">
              <th scope="col" className="pb-2 font-bold">
                NFTs
              </th>
              <th scope="col" className="pb-2 text-center font-bold">
                Edições
              </th>
              <th scope="col" className="pb-2 text-right font-bold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.lineId}>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={line.image.small}
                      alt=""
                      width={400}
                      height={400}
                      className="size-10 rounded-sm object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold">{line.name}</span>
                      <span className="text-text-secondary">
                        ID do token: {line.tokenId} · {line.editionLabel}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-2 text-center text-text-secondary">(x {line.quantity})</td>
                <td className="py-2 text-right text-sm font-bold text-primary">
                  {formatEth(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto flex w-full max-w-60 flex-col gap-1 text-xs">
          {order.coupon && (
            <div className="flex justify-between">
              <dt>Desconto ({order.coupon.code})</dt>
              <dd>(-) {formatEth(order.summary.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(order.summary.networkFee, { minimumFractionDigits: 3 })}</dd>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <dt>Total</dt>
            <dd className="text-primary">
              {formatEth(order.summary.total, { minimumFractionDigits: 3 })}
            </dd>
          </div>
        </dl>
        <p className="border-t border-border pt-3 text-center text-xs text-text-secondary">
          Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida
          para a carteira {shortenAddress(order.wallet.address)} e registrada na rede.
        </p>
        <Button asChild size="sm" className="self-center">
          <a href={order.transaction.explorerUrl} target="_blank" rel="noopener noreferrer">
            Ver no Etherscan
            <ExternalLinkIcon aria-hidden="true" />
            <span className="sr-only">(transação simulada, abre em nova aba)</span>
          </a>
        </Button>
      </section>
    </article>
  );
}
