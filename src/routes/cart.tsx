import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Carrinho de NFTs · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Carrinho de NFTs" phase="fase 2.5" />,
});
