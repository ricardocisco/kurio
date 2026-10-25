import { NftCard, NftCardSkeleton } from '@/features/nfts/components/NftCard';
import { isApiError } from '@/shared/api/api-error';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import type { CatalogPage } from '@/shared/contracts/nft';
import { CATALOG_PAGE_SIZE } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

interface CatalogResultsProps {
  data: CatalogPage | undefined;
  error: Error | null;
  isInitialLoading: boolean;
  isUpdating: boolean;
  isRefetching: boolean;
  hasActiveFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onGoToFirstPage: () => void;
}

const gridClass =
  'grid grid-cols-2 items-start gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:gap-x-6 [&>*:nth-child(even)]:mt-8 md:[&>*:nth-child(even)]:mt-0';

export function CatalogResults({
  data,
  error,
  isInitialLoading,
  isUpdating,
  isRefetching,
  hasActiveFilters,
  onRetry,
  onClearFilters,
  onGoToFirstPage,
}: CatalogResultsProps) {
  const announcement = isInitialLoading
    ? 'Carregando NFTs…'
    : isUpdating
      ? 'Atualizando resultados…'
      : data
        ? `${data.totalItems} ${data.totalItems === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`
        : '';

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {renderContent()}
    </div>
  );

  function renderContent() {
    if (isInitialLoading) {
      return (
        <ul className={gridClass} aria-hidden="true">
          {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      );
    }

    if (!data) {
      return (
        <StatusMessage
          variant="error"
          title="Não foi possível carregar o catálogo"
          description={isApiError(error) ? error.message : undefined}
          action={<RetryButton onRetry={onRetry} isRetrying={isRefetching} />}
        />
      );
    }

    if (data.items.length === 0) {
      const isPastLastPage = data.totalItems > 0;
      return (
        <StatusMessage
          variant="empty"
          title={isPastLastPage ? 'Esta página não existe' : 'Nenhum NFT encontrado'}
          description={
            isPastLastPage
              ? `O catálogo tem ${data.totalPages} páginas para estes filtros.`
              : hasActiveFilters
                ? 'Tente remover alguns filtros ou buscar por outro termo.'
                : 'Ainda não há NFTs listados. Volte em breve para novos lançamentos.'
          }
          action={
            isPastLastPage ? (
              <Button onClick={onGoToFirstPage}>Ir para a primeira página</Button>
            ) : hasActiveFilters ? (
              <Button variant="outline" onClick={onClearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <>
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/50 px-4 py-3 text-sm"
          >
            <span>Não foi possível atualizar a listagem. Exibindo os últimos resultados.</span>
            <RetryButton onRetry={onRetry} isRetrying={isRefetching} />
          </div>
        )}
        <ul
          className={cn(gridClass, 'transition-opacity', isUpdating && 'opacity-60')}
          aria-busy={isUpdating}
        >
          {data.items.map((nft, index) => (
            <li key={nft.id}>
              <NftCard nft={nft} priority={index < 3} />
            </li>
          ))}
        </ul>
      </>
    );
  }
}
