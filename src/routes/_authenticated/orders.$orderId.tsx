import { createFileRoute } from '@tanstack/react-router';

import { OrderPage } from '@/features/orders/pages/OrderPage';

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação de pedido · Kurio' }] }),
  component: OrderRoute,
});

function OrderRoute() {
  const { orderId } = Route.useParams();
  return <OrderPage orderId={orderId} />;
}
