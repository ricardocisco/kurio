import { Link } from '@tanstack/react-router';
import type * as React from 'react';

import { NewsletterForm } from '@/features/newsletter/components/NewsletterForm';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  XSocialIcon,
  YoutubeIcon,
} from '@/shared/components/SocialIcons';
import type { CategoryId } from '@/shared/contracts/nft';
import { useComingSoon } from '@/shared/hooks/use-coming-soon';

const HIGHLIGHTS = [
  {
    badge: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    badge: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    badge: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const;

const COLLECTION_LINKS: { label: string; category: CategoryId }[] = [
  { label: 'Arte digital', category: 'digital-art' },
  { label: 'Fotografia', category: 'photography' },
  { label: 'Música', category: 'music' },
  { label: 'Arte 3D', category: '3d-art' },
  { label: 'Utilidade', category: 'utility' },
];

const PROFILE_PLACEHOLDERS = ['Minha coleção', 'Atividade', 'Estúdio do criador'];
const HELP_PLACEHOLDERS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
];

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com', Icon: InstagramIcon },
  { label: 'X (Twitter)', href: 'https://x.com', Icon: XSocialIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', Icon: LinkedinIcon },
  { label: 'YouTube', href: 'https://www.youtube.com', Icon: YoutubeIcon },
] as const;

const footerLinkClass =
  'text-left text-xs text-text-secondary transition-colors lg:text-sm hover:text-primary focus-visible:text-primary';

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 lg:gap-2">
      <h2 className="text-sm font-bold text-foreground lg:text-lg">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

export function AppFooter() {
  const showComingSoon = useComingSoon();

  return (
    <footer className="container-content mt-20 pb-24 md:pb-6 lg:mt-24">
      <section
        aria-label="Por que a Kurio"
        className="grid gap-8 bg-card px-6 py-8 md:px-10 lg:grid-cols-[245fr_262fr_278fr_403fr] lg:gap-0 lg:pt-8 lg:pr-12 lg:pb-4 lg:pl-12"
      >
        {HIGHLIGHTS.map((highlight) => (
          <div
            key={highlight.title}
            className="flex flex-col gap-3 lg:gap-2 lg:border-r lg:border-primary/60 lg:px-4 first:lg:pl-0"
          >
            <span
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground lg:mb-3 lg:size-[4.5rem] lg:text-2xl"
            >
              {highlight.badge}
            </span>
            <h2 className="text-sm font-bold text-foreground lg:text-[1.0625rem]">
              {highlight.title}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground lg:text-sm lg:leading-[1.6]">
              {highlight.description}
            </p>
          </div>
        ))}
        <div className="flex flex-col gap-3 lg:pl-4">
          <h2 className="text-sm leading-tight font-bold text-foreground lg:text-lg">
            Antecipe-se ao próximo lançamento
          </h2>
          <NewsletterForm />
          <p className="text-xs leading-relaxed text-muted-foreground lg:text-[0.8125rem] lg:leading-[1.7]">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </section>

      <div className="grid gap-3 bg-surface-band px-6 py-5 text-xs text-foreground sm:grid-cols-2 md:px-10 lg:grid-cols-4 lg:px-8 lg:py-6 lg:text-sm">
        <span className="font-bold tracking-[0.2em] uppercase">Kurio</span>
        <span>Feito para colecionadores, criadores e cultura</span>
        <a href="mailto:contato@email.com" className="hover:text-primary">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="hover:text-primary">
          +55 11 4002 8922
        </a>
      </div>

      <nav
        aria-label="Rodapé"
        className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-5 gap-y-8 bg-card px-5 py-8 break-words sm:gap-8 sm:px-6 md:px-10 lg:grid-cols-4 lg:px-8 lg:pt-7"
      >
        <FooterColumn title="Meu perfil">
          <li>
            <Link to="/account/profile" className={footerLinkClass}>
              Meu perfil
            </Link>
          </li>
          <li>
            <Link to="/account/favorites" className={footerLinkClass}>
              Lista de interesse
            </Link>
          </li>
          {PROFILE_PLACEHOLDERS.map((label) => (
            <li key={label}>
              <button
                type="button"
                className={footerLinkClass}
                onClick={() => showComingSoon(label)}
              >
                {label}
              </button>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Central de ajuda">
          {HELP_PLACEHOLDERS.map((label) => (
            <li key={label}>
              <button
                type="button"
                className={footerLinkClass}
                onClick={() => showComingSoon(label)}
              >
                {label}
              </button>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Coleções">
          {COLLECTION_LINKS.map(({ label, category }) => (
            <li key={category}>
              <Link
                to="/marketplace"
                search={{ categories: [category] }}
                className={footerLinkClass}
              >
                {label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground lg:text-lg">Redes sociais</h2>
            <ul className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="size-4" />
                    <span className="sr-only">{label} (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground lg:text-lg">Carteiras compatíveis</h2>
            <p className="w-fit rounded-sm border border-primary/60 bg-surface-band px-3 py-1 text-[0.625rem] font-bold tracking-wide text-primary">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
      </nav>

      <p className="pt-4 text-center text-xs text-text-secondary lg:text-sm">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  );
}
