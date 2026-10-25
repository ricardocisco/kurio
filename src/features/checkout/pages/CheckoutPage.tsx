import { useQuery } from '@tanstack/react-query';
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { useState } from 'react';

import { useSession } from '@/features/auth/hooks/use-session';
import { useCart } from '@/features/cart/hooks/use-cart';
import { walletsQueryOptions } from '@/features/wallets/api/wallets.queries';
import { isApiError } from '@/shared/api/api-error';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import type { CheckoutFormOutput } from '@/shared/contracts/checkout';
import type { SessionUser } from '@/shared/contracts/session';
import type { Wallet } from '@/shared/contracts/wallets';
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/shared/hooks/use-media-query';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { CheckoutDialog } from '../components/CheckoutDialog';
import { CheckoutOrderLines, CheckoutTotals } from '../components/CheckoutOrderLines';
import { CollectorFields } from '../components/CollectorFields';
import { WalletSelection } from '../components/WalletSelection';
import { useCheckoutFlow } from '../hooks/use-checkout-flow';
import { useCheckoutForm } from '../model/use-checkout-form';

function MobileCheckoutHeader() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <div className="relative flex items-center justify-center py-2 md:hidden">
      <button
        type="button"
        onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: '/cart' }))}
        className="absolute left-0 flex size-9 items-center justify-center rounded-full bg-card text-primary"
        aria-label="Voltar"
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>
      <h1 className="text-lg font-bold">Pagamento com carteira</h1>
    </div>
  );
}

function CheckoutContent({ user, wallets }: { user: SessionUser; wallets: Wallet[] }) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const navigate = useNavigate();
  const { cart } = useCart();
  const flow = useCheckoutFlow(user.id);
  const { form, selectWallet, useOtherWallet } = useCheckoutForm(user, wallets);
  const [submittedForm, setSubmittedForm] = useState<CheckoutFormOutput | null>(null);
  const isBusy = flow.state.step !== 'idle';

  const handleConfirm = form.handleSubmit((values) => {
    setSubmittedForm(values);
    void flow.startReview(values);
  });

  const withForm = (action: (values: CheckoutFormOutput) => void) => () => {
    if (submittedForm) action(submittedForm);
  };

  const data = cart.data;
  const isFlowActive = flow.state.step === 'pending' || flow.state.step === 'submitting';
  if (data?.lines.length === 0 && !isFlowActive) {
    return (
      <StatusMessage
        variant="empty"
        title="Seu carrinho está vazio"
        description="Adicione NFTs ao carrinho para finalizar uma compra."
        action={
          <Button asChild>
            <Link to="/marketplace">Explorar o mercado</Link>
          </Button>
        }
      />
    );
  }

  const walletSection = (
    <WalletSelection
      form={form}
      wallets={wallets}
      onSelectWallet={selectWallet}
      onUseOtherWallet={useOtherWallet}
      disabled={isBusy}
    />
  );

  const summarySection = (
    <section aria-labelledby="checkout-items-title" className="flex flex-col gap-4">
      <h2
        id="checkout-items-title"
        className="flex justify-between border-b border-primary/50 pb-2 text-sm font-bold"
      >
        Seus NFTs <span className="font-normal text-text-secondary">Subtotal</span>
      </h2>
      {data ? (
        <>
          <CheckoutOrderLines lines={data.lines} />
          <p className="text-center text-xs text-text-secondary">
            Tem um código promocional?{' '}
            <Link to="/cart" className="text-primary hover:underline">
              Aplique no carrinho
            </Link>
          </p>
          <CheckoutTotals summary={data.summary} couponCode={data.coupon?.code} />
          {data.hasBlockingIssues && (
            <p role="alert" className="text-xs text-destructive">
              Alguns itens estão sem estoque suficiente.{' '}
              <Link to="/cart" className="font-bold underline">
                Revise o carrinho
              </Link>{' '}
              antes de finalizar.
            </p>
          )}
        </>
      ) : (
        <Skeleton className="h-48 w-full" />
      )}
    </section>
  );

  return (
    <form
      noValidate
      onSubmit={handleConfirm}
      aria-label="Pagamento"
      className="flex flex-col gap-8"
    >
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14">
        <div className="flex flex-col gap-10">
          {!isDesktop && walletSection}
          <fieldset disabled={isBusy} className="min-w-0">
            <CollectorFields form={form} />
          </fieldset>
        </div>
        <div className="flex flex-col gap-8">
          {summarySection}
          {isDesktop && walletSection}
          <Button
            type="submit"
            size={isDesktop ? 'md' : 'pill'}
            variant={isDesktop ? 'primary' : 'gradient'}
            disabled={isBusy || !data || data.hasBlockingIssues}
          >
            Confirmar compra
          </Button>
        </div>
      </div>

      <CheckoutDialog
        state={flow.state}
        form={submittedForm}
        onConnect={withForm((values) => void flow.connect(values))}
        onDisconnect={() => void flow.disconnect()}
        onPay={withForm(flow.pay)}
        onRetry={flow.retry}
        onRestart={() => {
          flow.reset();
          if (submittedForm) void flow.startReview(submittedForm);
          else void navigate({ to: '/checkout' });
        }}
        onClose={flow.reset}
      />
    </form>
  );
}

export function CheckoutPage() {
  const { user } = useSession();
  const wallets = useQuery({ ...walletsQueryOptions(user?.id ?? 'guest'), enabled: Boolean(user) });

  return (
    <div className="container-content flex flex-col gap-6 py-4 md:py-6">
      <MobileCheckoutHeader />
      <Breadcrumbs
        className="hidden md:block"
        items={[
          { label: 'Início', link: { to: '/' } },
          { label: 'Mercado', link: { to: '/marketplace' } },
          { label: 'Pagamento' },
        ]}
      />
      <h1 className="sr-only">Pagamento</h1>
      {!user || wallets.isPending ? (
        <div className="grid gap-10 md:grid-cols-[1fr_24rem]" aria-busy="true">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : wallets.isError ? (
        <StatusMessage
          variant="error"
          title="Não foi possível carregar suas carteiras"
          description={isApiError(wallets.error) ? wallets.error.message : undefined}
          action={
            <RetryButton onRetry={() => void wallets.refetch()} isRetrying={wallets.isRefetching} />
          }
        />
      ) : (
        <CheckoutContent user={user} wallets={wallets.data.items} />
      )}
    </div>
  );
}
