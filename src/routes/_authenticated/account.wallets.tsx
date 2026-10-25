import { createFileRoute } from '@tanstack/react-router';

import { AccountSessionSummary } from '@/features/account/components/AccountSessionSummary';
import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/_authenticated/account/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: () => (
    <UpcomingFeaturePage title="Carteiras" phase="fase 2.8">
      <AccountSessionSummary />
    </UpcomingFeaturePage>
  ),
});
