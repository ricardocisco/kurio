import { Link } from '@tanstack/react-router';

import { NftCard, NftCardSkeleton } from '@/features/nfts/components/NftCard';
import { isApiError } from '@/shared/api/api-error';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import { Button } from '@/shared/ui/button';

import { FavoriteButton } from '../components/FavoriteButton';
import { useFavorites } from '../hooks/use-favorites';

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6';

export function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <section
      aria-labelledby="favorites-title"
      className="container-content flex flex-col gap-6 py-6"
    >
      <Breadcrumbs
        className="hidden md:block"
        items={[{ label: 'Início', link: { to: '/' } }, { label: 'Lista de interesse' }]}
      />
      <header className="flex flex-col gap-1">
        <h1 id="favorites-title" className="text-2xl font-bold">
          Lista de interesse
        </h1>
        <p className="text-sm text-muted-foreground">
          Os NFTs que você favoritou ficam salvos na sua conta.
        </p>
      </header>

      {favorites.isPending ? (
        <ul className={gridClass} aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : favorites.isError ? (
        <StatusMessage
          variant="error"
          title="Não foi possível carregar seus favoritos"
          description={isApiError(favorites.error) ? favorites.error.message : undefined}
          action={
            <RetryButton
              onRetry={() => void favorites.refetch()}
              isRetrying={favorites.isRefetching}
            />
          }
        />
      ) : favorites.data.items.length === 0 ? (
        <StatusMessage
          variant="empty"
          title="Sua lista de interesse está vazia"
          description="Toque no coração de um NFT para salvá-lo aqui."
          action={
            <Button asChild>
              <Link to="/marketplace">Explorar o mercado</Link>
            </Button>
          }
        />
      ) : (
        <ul className={gridClass}>
          {favorites.data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} action={<FavoriteButton nft={nft} variant="overlay" />} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
