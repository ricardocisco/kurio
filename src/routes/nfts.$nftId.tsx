import { createFileRoute } from '@tanstack/react-router';

import { UpcomingFeaturePage } from '@/shared/components/UpcomingFeaturePage';

export const Route = createFileRoute('/nfts/$nftId')({
  head: () => ({ meta: [{ title: 'Detalhes do NFT · Kurio' }] }),
  component: () => <UpcomingFeaturePage title="Detalhes do NFT" phase="fase 2.2" />,
});
