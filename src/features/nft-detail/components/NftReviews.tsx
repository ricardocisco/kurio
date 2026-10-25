import { useInfiniteQuery } from '@tanstack/react-query';

import { nftReviewsInfiniteQueryOptions } from '@/features/nfts/api/nft.queries';
import { RatingStars } from '@/features/nfts/components/RatingStars';
import { isApiError } from '@/shared/api/api-error';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });

export function NftReviews({ nftId }: { nftId: string }) {
  const reviews = useInfiniteQuery(nftReviewsInfiniteQueryOptions(nftId));

  if (reviews.isPending) {
    return (
      <ul className="flex flex-col gap-4" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-sm bg-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </li>
        ))}
      </ul>
    );
  }

  if (reviews.isError && !reviews.data) {
    return (
      <StatusMessage
        variant="error"
        title="Não foi possível carregar as avaliações"
        description={isApiError(reviews.error) ? reviews.error.message : undefined}
        action={
          <RetryButton onRetry={() => void reviews.refetch()} isRetrying={reviews.isRefetching} />
        }
      />
    );
  }

  const items = reviews.data.pages.flatMap((page) => page.items);
  const total = reviews.data.pages[0]?.totalItems ?? 0;

  if (items.length === 0) {
    return <StatusMessage variant="empty" title="Este NFT ainda não tem avaliações" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status" aria-live="polite">
        Exibindo {items.length} de {total} avaliações
      </p>
      <ul className="flex flex-col gap-3">
        {items.map((review) => (
          <li key={review.id}>
            <article className="flex flex-col gap-2 rounded-sm bg-card p-4">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{review.authorName}</h3>
                <time dateTime={review.createdAt} className="text-xs text-text-secondary">
                  {dateFormatter.format(new Date(review.createdAt))}
                </time>
              </header>
              <RatingStars average={review.rating} variant="stars" />
              <p className="text-xs leading-relaxed text-muted-foreground">{review.comment}</p>
            </article>
          </li>
        ))}
      </ul>
      {reviews.hasNextPage && (
        <Button
          variant="outline"
          className="w-fit self-center"
          onClick={() => void reviews.fetchNextPage()}
          disabled={reviews.isFetchingNextPage}
        >
          {reviews.isFetchingNextPage ? 'Carregando…' : 'Ver mais avaliações'}
        </Button>
      )}
    </div>
  );
}
