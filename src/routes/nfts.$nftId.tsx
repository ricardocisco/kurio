import { createFileRoute, notFound } from '@tanstack/react-router';

import { NftDetailSkeleton } from '@/features/nft-detail/components/NftDetailSkeleton';
import { NftNotFound } from '@/features/nft-detail/components/NftNotFound';
import { nftDetailSearchSchema } from '@/features/nft-detail/model/nft-detail-search';
import { NftDetailPage } from '@/features/nft-detail/pages/NftDetailPage';
import { nftDetailQueryOptions, relatedNftsQueryOptions } from '@/features/nfts/api/nft.queries';
import { isApiError } from '@/shared/api/api-error';

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: nftDetailSearchSchema,
  staticData: { mobileNavigation: 'page-bar' },
  loader: async ({ context, params }) => {
    void context.queryClient.prefetchQuery(relatedNftsQueryOptions(params.nftId));
    try {
      const nft = await context.queryClient.ensureQueryData(nftDetailQueryOptions(params.nftId));
      return { name: nft.name, description: nft.description };
    } catch (error) {
      if (isApiError(error) && error.code === 'NOT_FOUND') throw notFound();
      throw error;
    }
  },
  // Show the skeleton quickly on slow networks, and keep it long enough to avoid a flash.
  pendingMs: 150,
  pendingMinMs: 400,
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: NftNotFound,
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} · Kurio` },
          { name: 'description', content: loaderData.description },
        ]
      : [{ title: 'NFT não encontrado · Kurio' }],
  }),
  component: NftDetailRoute,
});

function NftDetailRoute() {
  const { nftId } = Route.useParams();
  const { edition } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <NftDetailPage
      nftId={nftId}
      selectedEditionId={edition}
      onEditionChange={(editionId) =>
        void navigate({ search: { edition: editionId }, replace: true, resetScroll: false })
      }
    />
  );
}
