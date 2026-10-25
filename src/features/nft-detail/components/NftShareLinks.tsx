import { MailIcon } from 'lucide-react';

import { LinkedinIcon, XSocialIcon } from '@/shared/components/SocialIcons';

interface NftShareLinksProps {
  nftName: string;
  url: string;
}

export function NftShareLinks({ nftName, url }: NftShareLinksProps) {
  const text = `Confira ${nftName} na Kurio`;
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      Icon: LinkedinIcon,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      Icon: MailIcon,
    },
    {
      label: 'X (Twitter)',
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      Icon: XSocialIcon,
    },
  ];

  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      <span>Compartilhar este NFT:</span>
      <ul className="flex items-center gap-1">
        {links.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="flex size-7 items-center justify-center rounded-sm text-foreground transition-colors hover:text-primary"
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">
                Compartilhar por {label}
                {href.startsWith('mailto:') ? '' : ' (abre em nova aba)'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
