import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { isApiError } from '@/shared/api/api-error';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/shared/hooks/use-media-query';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { CartLineCard, CartLineRow } from '../components/CartLineRow';
import { CartSuggestions } from '../components/CartSuggestions';
import { CartSummary, CartSummarySkeleton } from '../components/CartSummary';
import { useCart } from '../hooks/use-cart';

function MobileCartHeader() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <div className="relative flex items-center justify-center py-2 md:hidden">
      <button
        type="button"
        onClick={() =>
          canGoBack ? router.history.back() : void router.navigate({ to: '/marketplace' })
        }
        className="absolute left-0 flex size-9 items-center justify-center rounded-full bg-card text-primary"
        aria-label="Voltar"
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>
      <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
    </div>
  );
}

function CartLinesSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton
          key={index}
          className={isDesktop ? 'h-20 w-full rounded-sm' : 'h-28 w-full rounded-xl'}
        />
      ))}
    </div>
  );
}

export function CartPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { cart, isResolving } = useCart();
  const data = cart.data;
  const isUpdating = cart.isFetching && !cart.isPending;

  useEffect(() => {
    data?.notices
      .filter((notice) => notice.type === 'coupon-removed')
      .forEach((notice) => toast.warning(notice.message));
  }, [data?.notices]);

  const content = () => {
    if (isResolving) {
      return (
        <div className="grid gap-8 md:grid-cols-[1fr_20rem] lg:gap-12">
          <CartLinesSkeleton isDesktop={isDesktop} />
          <CartSummarySkeleton />
        </div>
      );
    }

    if (!data) {
      return (
        <StatusMessage
          variant="error"
          title="Não foi possível carregar o carrinho"
          description={isApiError(cart.error) ? cart.error.message : undefined}
          action={
            <RetryButton onRetry={() => void cart.refetch()} isRetrying={cart.isRefetching} />
          }
        />
      );
    }

    if (data.lines.length === 0) {
      return (
        <StatusMessage
          variant="empty"
          title="Seu carrinho está vazio"
          description="Explore o mercado e adicione NFTs para continuar."
          action={
            <Button asChild>
              <Link to="/marketplace">Explorar o mercado</Link>
            </Button>
          }
        />
      );
    }

    return (
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        {isDesktop ? (
          <table className="w-full border-separate border-spacing-y-2">
            <caption className="sr-only">Itens do carrinho</caption>
            <thead>
              <tr className="text-left text-sm">
                <th scope="col" className="pb-1 pl-0 font-bold">
                  NFTs
                </th>
                <th scope="col" className="px-3 pb-1 font-bold">
                  Preço
                </th>
                <th scope="col" className="px-3 pb-1 font-bold">
                  Edições
                </th>
                <th scope="col" className="px-3 pb-1 font-bold">
                  Total
                </th>
                <th scope="col" className="pb-1">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <CartLineRow key={line.id} line={line} />
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="flex flex-col gap-4" aria-label="Itens do carrinho">
            {data.lines.map((line) => (
              <li key={line.id}>
                <CartLineCard line={line} />
              </li>
            ))}
          </ul>
        )}
        <div className={isDesktop ? 'sticky top-24' : undefined}>
          <CartSummary
            cart={data}
            variant={isDesktop ? 'panel' : 'sheet'}
            isUpdating={isUpdating}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="container-content flex flex-col gap-6 py-4 md:gap-16 md:py-6">
      <div className="flex flex-col gap-4">
        <MobileCartHeader />
        <Breadcrumbs
          className="hidden md:block"
          items={[
            { label: 'Início', link: { to: '/' } },
            { label: 'Mercado', link: { to: '/marketplace' } },
            { label: 'Carrinho' },
          ]}
        />
        {isDesktop && <h1 className="sr-only">Carrinho de NFTs</h1>}
        {content()}
      </div>
      {isDesktop && data && <CartSuggestions excludeIds={data.lines.map((line) => line.nftId)} />}
    </div>
  );
}
