import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação de pedido · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Confirmação de pedido" phase="fase 2.7" />,
});
