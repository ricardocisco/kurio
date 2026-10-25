import { createFileRoute } from '@tanstack/react-router';

import { ProfilePage } from '@/features/account/pages/ProfilePage';

export const Route = createFileRoute('/_authenticated/account/profile')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador · Kurio' }] }),
  component: ProfilePage,
});
