import { createFileRoute } from '@tanstack/react-router';

import { AccountSessionSummary } from '@/features/account/components/AccountSessionSummary';
import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/_authenticated/account/profile')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador · Kurio' }] }),
  component: () => (
    <UpcomingFeaturePage title="Perfil do colecionador" phase="fase 2.8">
      <AccountSessionSummary />
    </UpcomingFeaturePage>
  ),
});
