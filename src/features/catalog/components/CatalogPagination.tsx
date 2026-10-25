import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 5;

function visiblePages(page: number, totalPages: number): number[] {
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  const start = Math.max(1, Math.min(page - half, totalPages - MAX_VISIBLE_PAGES + 1));
  const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const itemClass =
  'flex size-7 items-center justify-center rounded-sm border border-border text-xs text-foreground transition-colors hover:border-primary hover:text-primary';

export function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <button type="button" className={itemClass} onClick={() => onPageChange(page - 1)}>
              <ChevronLeftIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">Página anterior</span>
            </button>
          </li>
        )}
        {visiblePages(page, totalPages).map((pageNumber) => {
          const isCurrent = pageNumber === page;
          return (
            <li key={pageNumber}>
              <button
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Página ${pageNumber}`}
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  itemClass,
                  isCurrent &&
                    'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground',
                )}
              >
                {pageNumber}
              </button>
            </li>
          );
        })}
        {page < totalPages && (
          <li>
            <button type="button" className={itemClass} onClick={() => onPageChange(page + 1)}>
              <ChevronRightIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">Próxima página</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
