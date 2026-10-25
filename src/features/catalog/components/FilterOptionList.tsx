import { CheckIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

interface FilterOption<TId extends string> {
  id: TId;
  label: string;
  count: number;
}

interface FilterOptionListProps<TId extends string> {
  title: string;
  options: FilterOption<TId>[];
  selected: readonly TId[];
  onToggle: (id: TId) => void;
  emphasizeCounts?: boolean;
}

export function FilterOptionList<TId extends string>({
  title,
  options,
  selected,
  onToggle,
  emphasizeCounts = false,
}: FilterOptionListProps<TId>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold text-foreground">{title}</legend>
      <ul className="flex flex-col gap-0.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-1.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  isSelected && 'bg-accent/60 text-primary',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <CheckIcon
                    aria-hidden="true"
                    className={cn(
                      'size-3 transition-opacity',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </span>
                <span className={cn('tabular-nums', emphasizeCounts && 'font-bold')}>
                  <span className="sr-only">, </span>({option.count})
                  <span className="sr-only"> itens</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
