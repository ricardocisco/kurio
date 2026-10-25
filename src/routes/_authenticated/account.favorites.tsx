import { createFileRoute } from '@tanstack/react-router';

import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage';

export const Route = createFileRoute('/_authenticated/account/favorites')({
  head: () => ({ meta: [{ title: 'Lista de interesse · Kurio' }] }),
  component: FavoritesPage,
});
