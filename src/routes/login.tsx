import { createFileRoute, redirect } from '@tanstack/react-router';

import { sessionQueryOptions } from '@/features/auth/api/session.queries';
import { authSearchSchema } from '@/features/auth/model/auth-search';
import { sanitizeRedirect } from '@/features/auth/model/redirect';
import { AuthPage } from '@/features/auth/pages/AuthPage';

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  staticData: { mobileNavigation: 'none', hideFooterOnMobile: true },
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (session) throw redirect({ href: sanitizeRedirect(search.redirect), replace: true });
  },
  head: () => ({ meta: [{ title: 'Entrar · Kurio' }] }),
  component: AuthRoute,
});

function AuthRoute() {
  const search = Route.useSearch();
  return <AuthPage mode="login" search={search} />;
}
