import { useSyncExternalStore } from 'react';

export interface RealtimeStatus {
  connection: 'idle' | 'connecting' | 'connected' | 'reconnecting';
  subscribedUserId: string | null;
  hasConnected: boolean;
}

let status: RealtimeStatus = { connection: 'idle', subscribedUserId: null, hasConnected: false };
const listeners = new Set<() => void>();

export function getRealtimeStatus(): RealtimeStatus {
  return status;
}

export function updateRealtimeStatus(patch: Partial<RealtimeStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach((listener) => listener());
}

export function isRealtimeConnected(): boolean {
  return status.connection === 'connected';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(subscribe, getRealtimeStatus);
}
