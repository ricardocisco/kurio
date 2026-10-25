import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Loader2Icon } from 'lucide-react';

import { useSession } from '@/features/auth/hooks/use-session';
import { isApiError } from '@/shared/api/api-error';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { orderQueryOptions } from '../api/orders.queries';
import { OrderReceipt } from '../components/OrderReceipt';

export function OrderPage({ orderId }: { orderId: string }) {
  const { user } = useSession();
  const order = useQuery({
    ...orderQueryOptions(user?.id ?? 'guest', orderId),
    enabled: Boolean(user),
  });

  const content = () => {
    if (!user || order.isPending) {
      return <Skeleton className="mx-auto h-[32rem] w-full max-w-xl" aria-busy="true" />;
    }
    if (order.isError) {
      if (isApiError(order.error) && order.error.code === 'NOT_FOUND') {
        return (
          <StatusMessage
            variant="empty"
            title="Pedido não encontrado"
            description="Este pedido não existe ou pertence a outra conta."
            action={
              <Button asChild>
                <Link to="/marketplace">Explorar o mercado</Link>
              </Button>
            }
          />
        );
      }
      return (
        <StatusMessage
          variant="error"
          title="Não foi possível carregar o pedido"
          description={isApiError(order.error) ? order.error.message : undefined}
          action={
            <RetryButton onRetry={() => void order.refetch()} isRetrying={order.isRefetching} />
          }
        />
      );
    }

    const data = order.data;
    if (data.status === 'confirmed' && data.transaction) {
      return <OrderReceipt order={{ ...data, transaction: data.transaction }} />;
    }
    if (data.status === 'declined') {
      return (
        <StatusMessage
          variant="error"
          title="Pagamento recusado"
          description={`${data.declineReason ?? 'A rede recusou a transação.'} Nenhum valor foi cobrado e seus itens continuam no carrinho.`}
          action={
            <Button asChild>
              <Link to="/cart">Voltar ao carrinho</Link>
            </Button>
          }
        />
      );
    }
    return (
      <div
        role="status"
        className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg bg-card px-6 py-12 text-center"
      >
        <Loader2Icon
          className="size-10 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <h1 className="text-base font-bold">Pedido {data.id} pendente</h1>
        <p className="text-xs text-muted-foreground">
          Aguardando a confirmação da rede. Esta página se atualiza sozinha.
        </p>
      </div>
    );
  };

  return <div className="container-content py-8 md:py-12">{content()}</div>;
}
