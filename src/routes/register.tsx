import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: 'Criar conta · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Criar conta" phase="fase 2.3" />,
});
