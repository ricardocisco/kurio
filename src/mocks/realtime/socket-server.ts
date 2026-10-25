import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws, type WebSocketHandlerConnection } from 'msw';

import { env } from '@/shared/config/env';
import { REALTIME_EVENTS, type RealtimeEvent } from '@/shared/contracts/events';

import { readDatabase } from '../db/database';

const ENGINE_IO_PING = '2';
const HEARTBEAT_INTERVAL_MS = 20_000;
const OFFLINE_CLOSE_CODE = 4000;

interface RealtimeConnection {
  id: string;
  raw: WebSocketHandlerConnection['client'];
  emit: (event: string, payload: unknown) => void;
  userId: string | null;
}

const connections = new Map<string, RealtimeConnection>();
const subscriptionListeners = new Set<(userId: string) => void>();
let isAvailable = true;
let lastEvent: RealtimeEvent | null = null;

const realtimeLink = ws.link(`${env.VITE_SOCKET_URL.replace(/\/$/, '')}/*`);

function resolveUserId(token: unknown): string | null {
  if (typeof token !== 'string') return null;
  const session = readDatabase().sessions.find((item) => item.token === token);
  if (!session || new Date(session.expiresAt) <= new Date()) return null;
  return session.userId;
}

function readToken(payload: unknown): unknown {
  return typeof payload === 'object' && payload !== null
    ? (payload as { token?: unknown }).token
    : undefined;
}

export const realtimeHandlers = [
  realtimeLink.addEventListener('connection', (connection) => {
    if (!isAvailable) {
      connection.client.close(OFFLINE_CLOSE_CODE, 'Realtime service unavailable');
      return;
    }

    const io = toSocketIo(connection);
    const entry: RealtimeConnection = {
      id: connection.client.id,
      raw: connection.client,
      emit: (event, payload) => io.client.emit(event, payload),
      userId: null,
    };
    connections.set(entry.id, entry);

    const heartbeat = setInterval(
      () => connection.client.send(ENGINE_IO_PING),
      HEARTBEAT_INTERVAL_MS,
    );
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat);
      connections.delete(entry.id);
    });

    io.client.on(REALTIME_EVENTS.subscribe, (_event, payload: unknown) => {
      const userId = resolveUserId(readToken(payload));
      if (!userId) {
        entry.userId = null;
        entry.emit(REALTIME_EVENTS.subscriptionRejected, { reason: 'invalid-session' });
        return;
      }
      entry.userId = userId;
      entry.emit(REALTIME_EVENTS.subscribed, { userId });
      subscriptionListeners.forEach((listener) => listener(userId));
    });

    io.client.on(REALTIME_EVENTS.unsubscribe, () => {
      entry.userId = null;
      entry.emit(REALTIME_EVENTS.subscribed, { userId: null });
    });
  }),
];

export function publishRealtimeEvent(event: RealtimeEvent): void {
  lastEvent = event;
  for (const connection of connections.values()) {
    if (event.userId === null || connection.userId === event.userId) {
      connection.emit(event.type, event);
    }
  }
}

export function broadcastToAll(event: RealtimeEvent): void {
  connections.forEach((connection) => connection.emit(event.type, event));
}

export function replayLastRealtimeEvent(): RealtimeEvent | null {
  if (lastEvent) publishRealtimeEvent(lastEvent);
  return lastEvent;
}

export function setRealtimeAvailable(available: boolean): void {
  isAvailable = available;
  if (!available) {
    connections.forEach((connection) =>
      connection.raw.close(OFFLINE_CLOSE_CODE, 'Realtime service unavailable'),
    );
    connections.clear();
  }
}

export function onRealtimeSubscription(listener: (userId: string) => void): () => void {
  subscriptionListeners.add(listener);
  return () => subscriptionListeners.delete(listener);
}

export function realtimeConnectionCount(): number {
  return connections.size;
}
