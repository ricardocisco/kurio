import { useId, useState } from 'react';

import type { CatalogFacets } from '@/shared/contracts/nft';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';

interface PriceRangeFilterProps {
  range: CatalogFacets['priceRange'];
  minPrice: string | undefined;
  maxPrice: string | undefined;
  onApply: (minPrice: string | undefined, maxPrice: string | undefined) => void;
}

const SLIDER_STEP = 0.01;
const priceFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function PriceRangeFilter({ range, minPrice, maxPrice, onApply }: PriceRangeFilterProps) {
  const labelId = useId();
  const bounds = [Number(range.min), Number(range.max)] as const;
  const [draft, setDraft] = useState<[number, number]>([
    minPrice ? Number(minPrice) : bounds[0],
    maxPrice ? Number(maxPrice) : bounds[1],
  ]);

  const handleApply = () => {
    const [draftMin, draftMax] = draft;
    onApply(
      draftMin > bounds[0] ? draftMin.toFixed(2) : undefined,
      draftMax < bounds[1] ? draftMax.toFixed(2) : undefined,
    );
  };

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-3">
      <h3 id={labelId} className="text-sm font-bold text-foreground lg:text-lg">
        Faixa de preço
      </h3>
      <Slider
        min={bounds[0]}
        max={bounds[1]}
        step={SLIDER_STEP}
        minStepsBetweenThumbs={1}
        value={draft}
        onValueChange={(value) => setDraft([value[0] ?? bounds[0], value[1] ?? bounds[1]])}
        thumbLabels={['Preço mínimo em ETH', 'Preço máximo em ETH']}
        className="py-2"
      />
      <p className="text-xs text-text-secondary lg:text-[0.9375rem]" aria-live="polite">
        Preço: {priceFormatter.format(draft[0])} - {priceFormatter.format(draft[1])} ETH
      </p>
      <Button size="sm" className="w-fit lg:h-9 lg:px-3 lg:text-[0.9375rem]" onClick={handleApply}>
        Aplicar
      </Button>
    </div>
  );
}
