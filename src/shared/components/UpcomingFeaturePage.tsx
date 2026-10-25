import { Link } from '@tanstack/react-router';
import { HammerIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';

interface UpcomingFeaturePageProps {
  title: string;
  phase: string;
}

/**
 * Temporary page for routes that exist in the route tree but whose feature is still being built.
 * It states clearly that nothing happens here yet, instead of pretending to work.
 */
export function UpcomingFeaturePage({ title, phase }: UpcomingFeaturePageProps) {
  return (
    <section className="container-content py-16" aria-labelledby="upcoming-title">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-card px-6 py-12 text-center">
        <HammerIcon className="size-10 text-primary" aria-hidden="true" />
        <h1 id="upcoming-title" className="text-xl font-bold">
          {title}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Esta tela ainda está em desenvolvimento ({phase}). Nenhuma ação é executada aqui por
          enquanto.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    </section>
  );
}
