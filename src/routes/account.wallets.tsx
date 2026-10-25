import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/account/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Carteiras" phase="fase 2.8" />,
});
