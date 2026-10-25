import { ArrowRightIcon } from 'lucide-react';

import { NftImage } from '@/features/nfts/components/NftImage';
import { useComingSoon } from '@/shared/hooks/use-coming-soon';

import { JOURNAL_ARTICLES } from '../model/home-content';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export function MintJournal() {
  const showComingSoon = useComingSoon();

  return (
    <section
      aria-labelledby="journal-title"
      className="container-content mt-16 flex flex-col gap-8 md:mt-20"
    >
      <header className="flex flex-col gap-3 text-center">
        <h2 id="journal-title" className="text-2xl font-bold text-foreground">
          Diário da Cunhagem
        </h2>
        <p className="text-xs text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNAL_ARTICLES.map((article) => (
          <li key={article.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-sm bg-card">
              <NftImage
                image={article.image}
                sizes="(min-width: 1024px) 270px, (min-width: 640px) 45vw, 90vw"
                className="aspect-[4/3] object-top"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-[0.6875rem] text-text-secondary">
                  <time dateTime={article.date}>
                    {dateFormatter.format(new Date(article.date))}
                  </time>
                  <span aria-hidden="true"> | </span>
                  <span className="sr-only">, </span>
                  Leitura de {article.readingMinutes} min
                </p>
                <h3 className="text-sm leading-snug font-bold text-foreground">{article.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{article.excerpt}</p>
                <button
                  type="button"
                  onClick={() => showComingSoon('O Diário da Cunhagem')}
                  className="mt-auto inline-flex w-fit items-center gap-1 pt-2 text-xs text-primary hover:underline"
                >
                  Ler mais
                  <span className="sr-only">: {article.title}</span>
                  <ArrowRightIcon className="size-3" aria-hidden="true" />
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
