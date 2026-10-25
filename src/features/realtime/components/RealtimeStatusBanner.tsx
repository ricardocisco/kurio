import { WifiOff } from 'lucide-react';

import { useRealtimeStatus } from '@/shared/realtime/realtime-status';

export function RealtimeStatusBanner() {
  const { connection, hasConnected } = useRealtimeStatus();
  const isReconnecting = hasConnected && connection === 'reconnecting';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      {isReconnecting ? (
        <p className="pointer-events-auto flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">
          <WifiOff aria-hidden="true" className="size-4" />
          Atualizações em tempo real pausadas. Reconectando…
        </p>
      ) : null}
    </div>
  );
}
