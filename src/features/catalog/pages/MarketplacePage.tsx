import { CatalogSection, type CatalogSearchChangeHandler } from '../components/CatalogSection';
import type { CatalogSearch } from '../model/catalog-search';

interface MarketplacePageProps {
  search: CatalogSearch;
  onSearchChange: CatalogSearchChangeHandler;
}

/** "Mercado": the full catalog without the home editorial sections. */
export function MarketplacePage({ search, onSearchChange }: MarketplacePageProps) {
  return (
    <div className="flex flex-col gap-6 pt-4 md:pt-8">
      <header className="container-content max-md:sr-only">
        <h1 className="text-2xl font-bold">Mercado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore todas as coleções, filtre por categoria, rede e faixa de preço.
        </p>
      </header>
      <CatalogSection
        title="Todos os NFTs do mercado"
        search={search}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
