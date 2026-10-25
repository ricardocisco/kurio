import { Link } from '@tanstack/react-router';
import { CheckCircle2Icon, Loader2Icon, TriangleAlertIcon, WalletIcon } from 'lucide-react';
import type { RefObject } from 'react';

import type { CheckoutFormOutput, CheckoutQuote } from '@/shared/contracts/checkout';
import { shortenAddress, WALLET_PROVIDER_LABELS } from '@/shared/contracts/wallets';
import { formatEth, isEthEqual } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';

import type { CheckoutFlowState } from '../hooks/use-checkout-flow';

import { CheckoutOrderLines, CheckoutTotals } from './CheckoutOrderLines';

interface CheckoutDialogProps {
  state: CheckoutFlowState;
  form: CheckoutFormOutput | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onPay: () => void;
  onRetry: () => void;
  onRestart: () => void;
  onClose: () => void;
  returnFocusTo?: RefObject<HTMLElement | null>;
}

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const;
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

function changedLineIds(quote: CheckoutQuote, previous: CheckoutQuote | null): string[] {
  if (!previous) return [];
  return quote.lines
    .filter((line) => {
      const before = previous.lines.find((item) => item.lineId === line.lineId);
      return (
        !before ||
        !isEthEqual(before.unitPrice, line.unitPrice) ||
        before.quantity !== line.quantity
      );
    })
    .map((line) => line.lineId);
}

function Progress({ title, message }: { title: string; message: string }) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2Icon
        className="size-10 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-sm font-bold">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function CheckoutDialog(props: CheckoutDialogProps) {
  const { state } = props;
  const isOpen = state.step !== 'idle';
  const isLocked =
    state.step === 'submitting' || state.step === 'pending' || state.step === 'quoting';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLocked && props.onClose()}>
      <DialogContent
        showCloseButton={!isLocked}
        className="max-w-lg"
        onEscapeKeyDown={(event) => isLocked && event.preventDefault()}
        onInteractOutside={(event) => isLocked && event.preventDefault()}
        onCloseAutoFocus={(event) => {
          const target = props.returnFocusTo?.current;
          if (!target) return;
          event.preventDefault();
          target.focus();
        }}
      >
        <DialogContentBody {...props} />
      </DialogContent>
    </Dialog>
  );
}

function DialogContentBody({
  state,
  form,
  onConnect,
  onDisconnect,
  onPay,
  onRetry,
  onRestart,
  onClose,
}: CheckoutDialogProps) {
  switch (state.step) {
    case 'idle':
      return null;
    case 'quoting':
      return (
        <>
          <DialogTitle>Revisando seu pedido</DialogTitle>
          <DialogDescription className="sr-only">
            Calculando preços, disponibilidade e taxas.
          </DialogDescription>
          <Progress
            title="Validando preços e disponibilidade"
            message="Conferimos cada item, cupom e taxa antes de você pagar."
          />
        </>
      );
    case 'submitting':
      return (
        <>
          <DialogTitle>Enviando pedido</DialogTitle>
          <DialogDescription className="sr-only">Não feche esta página.</DialogDescription>
          <Progress
            title="Enviando seu pedido"
            message={state.message ?? 'Não feche esta página.'}
          />
        </>
      );
    case 'pending':
      return (
        <>
          <DialogTitle>Pagamento em processamento</DialogTitle>
          <DialogDescription className="sr-only">Aguardando confirmação da rede.</DialogDescription>
          <Progress
            title={`Pedido ${state.orderId} pendente`}
            message="Aguardando a confirmação da rede. Se você recarregar a página, retomamos este mesmo pedido."
          />
        </>
      );
    case 'declined':
      return (
        <>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlertIcon className="size-5" aria-hidden="true" />
            Pagamento recusado
          </DialogTitle>
          <DialogDescription>
            {state.order.declineReason ?? 'A rede recusou a transação.'}
          </DialogDescription>
          <p className="text-xs text-muted-foreground" role="alert">
            Nenhum valor foi cobrado e seus itens continuam no carrinho.
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to="/cart">Voltar ao carrinho</Link>
            </Button>
            <Button onClick={onRestart}>Tentar novamente</Button>
          </div>
        </>
      );
    case 'failed':
      return (
        <>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="size-5 text-destructive" aria-hidden="true" />
            Não foi possível concluir
          </DialogTitle>
          <DialogDescription role="alert">{state.message}</DialogDescription>
          <div className="flex flex-wrap justify-end gap-3">
            {state.action === 'cart' ? (
              <Button asChild>
                <Link to="/cart">Revisar carrinho</Link>
              </Button>
            ) : state.action === 'retry' ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button onClick={onRetry}>Tentar novamente</Button>
              </>
            ) : (
              <Button onClick={onRestart}>Revisar pedido novamente</Button>
            )}
          </div>
        </>
      );
    case 'review': {
      const { quote, previousQuote, connection, isConnecting, notice, walletError } = state;
      const changed = changedLineIds(quote, previousQuote);
      return (
        <>
          <DialogTitle>{previousQuote ? 'Valores atualizados' : 'Revise seu pedido'}</DialogTitle>
          <DialogDescription>
            Cotação válida até {timeFormatter.format(new Date(quote.expiresAt))} na rede{' '}
            {NETWORK_LABELS[quote.network]}.
          </DialogDescription>

          {notice && previousQuote && (
            <div
              role="alert"
              className="flex flex-col gap-1 rounded-md border border-warning/60 px-3 py-2 text-xs text-warning"
            >
              <p>{notice}</p>
              <p>
                Total anterior {formatEth(previousQuote.summary.total)} → novo total{' '}
                <strong>{formatEth(quote.summary.total)}</strong>.
              </p>
            </div>
          )}

          <CheckoutOrderLines lines={quote.lines} changedLineIds={changed} />
          <CheckoutTotals summary={quote.summary} couponCode={quote.coupon?.code} />

          <section
            aria-labelledby="checkout-wallet-title"
            className="flex flex-col gap-2 rounded-md border border-border p-3"
          >
            <h3 id="checkout-wallet-title" className="flex items-center gap-2 text-xs font-bold">
              <WalletIcon className="size-4 text-primary" aria-hidden="true" />
              {form ? WALLET_PROVIDER_LABELS[form.provider] : 'Carteira'}
            </h3>
            {connection ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-success" role="status">
                  <CheckCircle2Icon className="size-4" aria-hidden="true" />
                  Conectada: {shortenAddress(connection.address)}
                </span>
                <Button variant="link" size="sm" onClick={onDisconnect}>
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {form ? shortenAddress(form.address) : ''} · aguardando conexão
                </span>
                <Button variant="outline" size="sm" onClick={onConnect} disabled={isConnecting}>
                  {isConnecting ? 'Conectando…' : 'Conectar carteira'}
                </Button>
              </div>
            )}
            {walletError && (
              <p role="alert" className="text-xs text-destructive">
                {walletError}
              </p>
            )}
          </section>

          <Button size="lg" disabled={!connection} onClick={onPay}>
            {previousQuote ? 'Confirmar novos valores e pagar' : 'Confirmar e pagar'}
          </Button>
        </>
      );
    }
  }
}
