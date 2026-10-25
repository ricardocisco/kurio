import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { readSessionToken } from '@/features/auth/model/session-token';
import { useSession } from '@/features/auth/hooks/use-session';
import { announce } from '@/shared/a11y/announce';
import {
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
  REALTIME_EVENTS,
  sessionSubscribedSchema,
} from '@/shared/contracts/events';
import { formatEth } from '@/shared/lib/money';
import { loadRealtimeSocket, peekRealtimeSocket } from '@/shared/realtime/socket-client';

import {
  applyNftUpdated,
  applyOrderUpdated,
  reconcileAfterReconnect,
  type CartImpact,
} from '../model/apply-events';
import { EventLedger } from '../model/event-ledger';
import { notifyNftUpdate } from '@/shared/realtime/realtime-bus';
import { getRealtimeStatus, updateRealtimeStatus } from '@/shared/realtime/realtime-status';

import { RealtimeStatusBanner } from './RealtimeStatusBanner';

function describeImpact(impact: CartImpact): string {
  if (impact.available === 0) return `${impact.name} esgotou e foi marcado no seu carrinho.`;
  if (impact.available < impact.quantity) {
    return `${impact.name} agora tem apenas ${String(impact.available)} disponíveis.`;
  }
  return `O preço de ${impact.name} mudou de ${formatEth(impact.previousPrice)} para ${formatEth(impact.newPrice)}.`;
}

export function RealtimeConnector() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  const ledger = useRef(new EventLedger());

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    let isActive = true;
    let detach: (() => void) | null = null;
    updateRealtimeStatus({ connection: 'connecting' });

    void loadRealtimeSocket().then((socket) => {
      if (!isActive) return;

      const subscribeSession = () => {
        const token = readSessionToken();
        if (userIdRef.current && token) socket.emit(REALTIME_EVENTS.subscribe, { token });
      };

      const handleConnect = () => {
        const { hasConnected } = getRealtimeStatus();
        updateRealtimeStatus({ connection: 'connected', hasConnected: true });
        if (hasConnected) reconcileAfterReconnect(queryClient);
        subscribeSession();
      };

      const handleDisconnect = () => {
        updateRealtimeStatus({
          connection: getRealtimeStatus().hasConnected ? 'reconnecting' : 'connecting',
          subscribedUserId: null,
        });
      };

      const handleConnectError = () => {
        if (getRealtimeStatus().hasConnected) updateRealtimeStatus({ connection: 'reconnecting' });
      };

      const handleNftUpdated = (raw: unknown) => {
        const parsed = nftUpdatedEventSchema.safeParse(raw);
        if (!parsed.success || ledger.current.decide(parsed.data) !== 'accepted') return;
        const impacts = applyNftUpdated(queryClient, parsed.data);
        notifyNftUpdate(parsed.data);
        for (const impact of impacts) {
          const message = describeImpact(impact);
          toast.warning(message, { id: `cart-impact-${parsed.data.resourceId}` });
          announce(message);
        }
      };

      const handleOrderUpdated = (raw: unknown) => {
        const parsed = orderUpdatedEventSchema.safeParse(raw);
        const currentUserId = userIdRef.current;
        if (!parsed.success || !currentUserId || parsed.data.userId !== currentUserId) return;
        if (ledger.current.decide(parsed.data) !== 'accepted') return;
        applyOrderUpdated(queryClient, parsed.data, currentUserId);
      };

      const handleSubscribed = (raw: unknown) => {
        const parsed = sessionSubscribedSchema.safeParse(raw);
        if (parsed.success) updateRealtimeStatus({ subscribedUserId: parsed.data.userId });
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on(REALTIME_EVENTS.nftUpdated, handleNftUpdated);
      socket.on(REALTIME_EVENTS.orderUpdated, handleOrderUpdated);
      socket.on(REALTIME_EVENTS.subscribed, handleSubscribed);

      socket.connect();

      detach = () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off(REALTIME_EVENTS.nftUpdated, handleNftUpdated);
        socket.off(REALTIME_EVENTS.orderUpdated, handleOrderUpdated);
        socket.off(REALTIME_EVENTS.subscribed, handleSubscribed);
        socket.disconnect();
      };
    });

    return () => {
      isActive = false;
      detach?.();
      updateRealtimeStatus({ connection: 'idle', subscribedUserId: null, hasConnected: false });
    };
  }, [queryClient]);

  useEffect(() => {
    const socket = peekRealtimeSocket();
    if (!socket?.connected) return;
    const token = readSessionToken();
    if (userId && token) {
      socket.emit(REALTIME_EVENTS.subscribe, { token });
      return;
    }
    ledger.current.reset();
    socket.emit(REALTIME_EVENTS.unsubscribe);
  }, [userId]);

  return <RealtimeStatusBanner />;
}
