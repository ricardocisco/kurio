import { useId } from 'react';

import type { NftEdition } from '@/shared/contracts/nft';
import { cn } from '@/shared/lib/cn';

import { describeEditionAvailability, isEditionAvailable } from '../model/edition';

interface EditionSelectorProps {
  editions: NftEdition[];
  selectedId: string;
  onSelect: (editionId: string) => void;
}

/** Edition pills (1/1, 1/10, 1/50, ABERTA) as a native radio group. Sold-out editions are disabled. */
export function EditionSelector({ editions, selectedId, onSelect }: EditionSelectorProps) {
  const name = useId();
  const selected = editions.find((edition) => edition.id === selectedId);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold text-foreground">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const isAvailable = isEditionAvailable(edition);
          const inputId = `${name}-${edition.id}`;
          return (
            <div key={edition.id}>
              <input
                type="radio"
                id={inputId}
                name={name}
                value={edition.id}
                checked={edition.id === selectedId}
                disabled={!isAvailable && edition.id !== selectedId}
                onChange={() => onSelect(edition.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'inline-flex cursor-pointer items-center rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary/70',
                  'peer-checked:border-primary peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                  !isAvailable && 'cursor-not-allowed line-through opacity-50 hover:border-border',
                )}
              >
                {edition.label}
                <span className="sr-only"> ({describeEditionAvailability(edition)})</span>
              </label>
            </div>
          );
        })}
      </div>
      {selected && (
        <p
          className={cn(
            'text-xs',
            isEditionAvailable(selected) ? 'text-muted-foreground' : 'text-destructive',
          )}
          aria-live="polite"
        >
          {isEditionAvailable(selected)
            ? describeEditionAvailability(selected)
            : 'Esta edição está esgotada. Escolha outra edição disponível.'}
        </p>
      )}
    </fieldset>
  );
}
