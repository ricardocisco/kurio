import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/account/profile')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Perfil do colecionador" phase="fase 2.8" />,
});
