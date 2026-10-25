import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/_authenticated/checkout')({
  head: () => ({ meta: [{ title: 'Pagamento · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Pagamento" phase="fase 2.6" />,
});
