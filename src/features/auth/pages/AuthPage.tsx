import { useNavigate } from '@tanstack/react-router';

import { catalogSearchSchema } from '@/features/catalog/model/catalog-search';
import { HomePage } from '@/features/home/pages/HomePage';
import { Logo } from '@/shared/components/Logo';
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/shared/hooks/use-media-query';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';

import { AUTH_COPY, AuthPanel, type AuthMode } from '../components/AuthPanel';
import type { AuthSearch } from '../model/auth-search';

const BACKGROUND_SEARCH = catalogSearchSchema.parse({});

interface AuthPageProps {
  mode: AuthMode;
  search: AuthSearch;
}

export function AuthPage({ mode, search }: AuthPageProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const navigate = useNavigate();

  if (!isDesktop) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col gap-10 px-6 pt-16 pb-10">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <AuthPanel mode={mode} search={search} variant="page" />
      </section>
    );
  }

  return (
    <>
      <div inert aria-hidden="true">
        <HomePage search={BACKGROUND_SEARCH} onSearchChange={() => undefined} />
      </div>
      <Dialog open onOpenChange={(open) => !open && void navigate({ to: '/' })}>
        <DialogContent className="top-[12%] max-w-md translate-y-0 px-10 py-8">
          <DialogTitle className="sr-only">{AUTH_COPY[mode].title} na Kurio</DialogTitle>
          <DialogDescription className="sr-only">{AUTH_COPY[mode].description}</DialogDescription>
          <AuthPanel mode={mode} search={search} variant="dialog" />
        </DialogContent>
      </Dialog>
    </>
  );
}
