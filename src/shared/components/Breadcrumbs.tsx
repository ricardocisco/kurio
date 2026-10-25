import { Link, type LinkProps } from '@tanstack/react-router';

import { cn } from '@/shared/lib/cn';

export interface BreadcrumbItem {
  label: string;
  link?: Pick<LinkProps, 'to' | 'params' | 'search'>;
}

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Trilha de navegação" className={cn('text-xs font-medium', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.link && !isLast ? (
                <Link
                  {...item.link}
                  className="text-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="text-text-secondary">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-foreground">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
