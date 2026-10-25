import { StarIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

interface RatingStarsProps {
  average: number;
  count?: number;
  variant?: 'full' | 'compact' | 'stars';
  className?: string;
}

const ratingFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function RatingStars({ average, count, variant = 'full', className }: RatingStarsProps) {
  const label = `Nota ${ratingFormatter.format(average)} de 5${count === undefined ? '' : `, ${count} avaliações`}`;

  if (variant === 'compact') {
    return (
      <p
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-xs font-bold',
          className,
        )}
      >
        <StarIcon className="size-3.5 fill-primary text-primary" aria-hidden="true" />
        <span aria-hidden="true">
          {average.toFixed(1)}
          {count !== undefined && <span className="font-normal">({count})</span>}
        </span>
        <span className="sr-only">{label}</span>
      </p>
    );
  }

  const filledStars = Math.round(average);
  return (
    <p className={cn('inline-flex items-center gap-2 text-xs text-text-secondary', className)}>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            className={cn(
              'size-3.5 text-primary',
              index < filledStars ? 'fill-primary' : 'fill-transparent opacity-50',
            )}
          />
        ))}
      </span>
      <span className="sr-only">{label}</span>
      {variant === 'full' && count !== undefined && (
        <span aria-hidden="true">{count} avaliações de colecionadores</span>
      )}
    </p>
  );
}
