import type { NftDetail } from '@/shared/contracts/nft';

import { createNftFixtures } from '../fixtures/nfts';

/**
 * In-memory mock database shared by every REST handler and by the simulated Socket.IO server.
 * It is persisted to localStorage so refreshes keep the simulated backend state, and it can be
 * reset to a known fixture state at any time (`resetDatabase`).
 *
 * Bump `SCHEMA_VERSION` whenever the shape of `DatabaseState` OR the fixtures change: persisted
 * snapshots from an older version are discarded instead of being migrated, so every visitor
 * (including the public demo) sees the current fixtures.
 */
const STORAGE_KEY = 'kurio.mocks.db';
const SCHEMA_VERSION = 2;

export interface DatabaseState {
  schemaVersion: number;
  nfts: NftDetail[];
  newsletterSubscribers: string[];
}

type Listener = (state: DatabaseState) => void;

function createInitialState(): DatabaseState {
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createNftFixtures(),
    newsletterSubscribers: [],
  };
}

function loadPersistedState(): DatabaseState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    return parsed.schemaVersion === SCHEMA_VERSION ? (parsed as DatabaseState) : null;
  } catch {
    return null;
  }
}

function persist(state: DatabaseState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the simulation keeps working in memory only.
  }
}

let state: DatabaseState = loadPersistedState() ?? createInitialState();
const listeners = new Set<Listener>();

/** Read-only access. Callers must not mutate the returned objects; use `updateDatabase`. */
export function readDatabase(): Readonly<DatabaseState> {
  return state;
}

/**
 * Applies a mutation atomically: the recipe receives a draft copy, and the new state is only
 * committed (and persisted) if the recipe does not throw.
 */
export function updateDatabase<TResult>(recipe: (draft: DatabaseState) => TResult): TResult {
  const draft = structuredClone(state);
  const result = recipe(draft);
  state = draft;
  persist(state);
  listeners.forEach((listener) => listener(state));
  return result;
}

/** Restores the full fixture state (all users, carts, orders... back to the seed). */
export function resetDatabase(): void {
  state = createInitialState();
  persist(state);
  listeners.forEach((listener) => listener(state));
}

export function subscribeToDatabase(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
