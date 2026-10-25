import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Entrar · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Entrar" phase="fase 2.3" />,
});
