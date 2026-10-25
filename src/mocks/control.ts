import { resetNetworkSimulation } from './config/network';
import {
  getActiveScenarioName,
  isScenarioName,
  SCENARIOS,
  setActiveScenario,
  type ScenarioName,
} from './config/scenarios';
import { resetDatabase } from './db/database';
import { expireAllSessions } from './utils/auth';
import { createNftUpdatedEvent } from './realtime/events';
import {
  broadcastToAll,
  realtimeConnectionCount,
  replayLastRealtimeEvent,
  setRealtimeAvailable,
} from './realtime/socket-server';
import { readDatabase } from './db/database';
import { updateEdition } from './utils/catalog-mutations';

export interface MockControl {
  scenarios: Record<ScenarioName, string>;
  getScenario: () => ScenarioName;
  setScenario: (name: string) => void;
  reset: () => void;
  expireSessions: () => void;
  setEditionPrice: (nftId: string, editionId: string, price: string) => void;
  setEditionAvailability: (nftId: string, editionId: string, available: number) => void;
  realtime: {
    setAvailable: (available: boolean) => void;
    connectionCount: () => number;
    replayLastEvent: () => void;
    emitStaleNftEvent: (nftId: string, price: string) => void;
    emitForeignOrderEvent: (orderId: string) => void;
  };
}

export function createMockControl(): MockControl {
  return {
    scenarios: Object.fromEntries(
      Object.entries(SCENARIOS).map(([name, definition]) => [name, definition.description]),
    ) as Record<ScenarioName, string>,
    getScenario: getActiveScenarioName,
    setScenario: (name) => {
      if (!isScenarioName(name)) throw new Error(`Unknown mock scenario "${name}"`);
      setActiveScenario(name);
    },
    reset: () => {
      resetDatabase();
      resetNetworkSimulation();
    },
    expireSessions: expireAllSessions,
    setEditionPrice: (nftId, editionId, price) => {
      updateEdition({ nftId, editionId, price });
    },
    setEditionAvailability: (nftId, editionId, available) => {
      updateEdition({ nftId, editionId, available });
    },
    realtime: {
      setAvailable: setRealtimeAvailable,
      connectionCount: realtimeConnectionCount,
      replayLastEvent: () => {
        replayLastRealtimeEvent();
      },
      emitStaleNftEvent: (nftId, price) => {
        const nft = readDatabase().nfts.find((item) => item.id === nftId);
        if (!nft) throw new Error(`Unknown NFT ${nftId}`);
        const stale = createNftUpdatedEvent(nft, { version: Math.max(1, nft.version - 1) });
        broadcastToAll({
          ...stale,
          payload: {
            ...stale.payload,
            price,
            editions: stale.payload.editions.map((edition) =>
              edition.id === nft.defaultEditionId ? { ...edition, price } : edition,
            ),
          },
        });
      },
      emitForeignOrderEvent: (orderId) => {
        const record = readDatabase().orders[orderId];
        if (!record) throw new Error(`Unknown order ${orderId}`);
        broadcastToAll({
          eventId: `evt-${crypto.randomUUID()}`,
          type: 'order.updated',
          resource: 'order',
          resourceId: orderId,
          version: record.order.version + 10,
          occurredAt: new Date().toISOString(),
          userId: 'user-intruder',
          payload: { ...record.order, status: 'declined', version: record.order.version + 10 },
        });
      },
    },
  };
}

declare global {
  interface Window {
    __kurioMocks?: MockControl;
  }
}
