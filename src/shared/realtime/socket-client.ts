import type { Socket } from 'socket.io-client';

import { env } from '@/shared/config/env';

let socket: Socket | null = null;
let pending: Promise<Socket> | null = null;

export function loadRealtimeSocket(): Promise<Socket> {
  pending ??= import('socket.io-client').then(({ io }) => {
    socket = io(env.VITE_SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
    return socket;
  });
  return pending;
}

export function peekRealtimeSocket(): Socket | null {
  return socket;
}
