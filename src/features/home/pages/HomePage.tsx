import {
  CatalogSection,
  type CatalogSearchChangeHandler,
} from '@/features/catalog/components/CatalogSection';
import type { CatalogSearch } from '@/features/catalog/model/catalog-search';
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/shared/hooks/use-media-query';

import { DesktopHomeHero, MobileHomeHero } from '../components/HomeHero';
import { MintJournal } from '../components/MintJournal';
import { PromoBanners } from '../components/PromoBanners';
import { SpotlightCard } from '../components/SpotlightCard';

interface HomePageProps {
  search: CatalogSearch;
  onSearchChange: CatalogSearchChangeHandler;
}

export function HomePage({ search, onSearchChange }: HomePageProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  return (
    <div className="flex flex-col gap-6 pt-4 md:gap-14 md:pt-0">
      {isDesktop && <DesktopHomeHero />}
      <CatalogSection
        title="Catálogo de NFTs"
        search={search}
        onSearchChange={onSearchChange}
        sidebarAddon={isDesktop ? <SpotlightCard /> : undefined}
        mobileHeader={isDesktop ? undefined : <MobileHomeHero />}
      />
      <PromoBanners />
      <MintJournal />
    </div>
  );
}
