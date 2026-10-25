import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/features/auth/hooks/use-session';
import { isApiError } from '@/shared/api/api-error';

import { mergeGuestCart } from '../api/cart.api';
import { cartQueryKey } from '../model/cart-owner';
import { clearGuestCartId, readGuestCartId } from '../model/guest-cart-id';

export function CartSessionSync() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const mergingFor = useRef<string | null>(null);

  useEffect(() => {
    const guestCartId = readGuestCartId();
    if (!user || !guestCartId) return;
    const mergeKey = `${user.id}:${guestCartId}`;
    if (mergingFor.current === mergeKey) return;
    mergingFor.current = mergeKey;

    mergeGuestCart(guestCartId)
      .then((cart) => {
        clearGuestCartId();
        queryClient.removeQueries({ queryKey: cartQueryKey({ kind: 'guest', guestCartId }) });
        queryClient.setQueryData(cartQueryKey({ kind: 'user', userId: user.id }), cart);
        const notice = cart.notices.find((item) => item.type === 'lines-merged');
        if (notice) toast.success(notice.message);
      })
      .catch((error: unknown) => {
        mergingFor.current = null;
        if (isApiError(error) && error.isAuthError) return;
        toast.error('Não foi possível juntar o carrinho de visitante à sua conta.', {
          description: 'Seus itens continuam salvos neste navegador. Tente atualizar a página.',
        });
      });
  }, [queryClient, user]);

  return null;
}
