import { Link } from '@tanstack/react-router';

import { Button } from '@/shared/ui/button';

import { StatusMessage } from './StatusMessage';

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço acessado não existe ou foi movido.',
}: NotFoundPageProps) {
  return (
    <section className="container-content py-16" aria-labelledby="not-found-title">
      <h1 id="not-found-title" className="sr-only">
        {title}
      </h1>
      <StatusMessage
        variant="empty"
        title={title}
        description={description}
        action={
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        }
      />
    </section>
  );
}
