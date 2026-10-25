import { toast } from 'sonner';

import { isApiError } from '@/shared/api/api-error';
import type { CartLine } from '@/shared/contracts/cart';

import { useRemoveCartLine, useUpdateCartLine } from '../hooks/use-cart';

function showError(error: unknown) {
  toast.error(isApiError(error) ? error.message : 'Não foi possível atualizar o carrinho.');
}

export function useCartLineControls(line: CartLine) {
  const update = useUpdateCartLine();
  const remove = useRemoveCartLine();
  const isUpdating = update.isPending || remove.isPending;

  return {
    isUpdating,
    setQuantity: (quantity: number) =>
      update.mutate({ lineId: line.id, quantity }, { onError: showError }),
    acknowledgePrice: () =>
      update.mutate({ lineId: line.id, acknowledgePriceChange: true }, { onError: showError }),
    remove: () => remove.mutate({ lineId: line.id, name: line.name }, { onError: showError }),
  };
}
