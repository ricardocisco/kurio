import type { NftDetail } from '@/shared/contracts/nft';

import { createNftFixtures } from '../fixtures/nfts';
import { createUserFixtures, type UserRecord } from '../fixtures/users';

const STORAGE_KEY = 'kurio.mocks.db';
const SCHEMA_VERSION = 4;

export interface DatabaseState {
  schemaVersion: number;
  nfts: NftDetail[];
  newsletterSubscribers: string[];
  users: UserRecord[];
  sessions: SessionRecord[];
  favorites: Record<string, FavoriteRecord[]>;
}

export interface FavoriteRecord {
  nftId: string;
  addedAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

type Listener = (state: DatabaseState) => void;

function createInitialState(): DatabaseState {
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createNftFixtures(),
    newsletterSubscribers: [],
    users: createUserFixtures(),
    sessions: [],
    favorites: {
      'user-nova': [{ nftId: 'golden-beat-0207', addedAt: '2026-09-20T12:00:00.000Z' }],
    },
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
    return;
  }
}

let state: DatabaseState = loadPersistedState() ?? createInitialState();
const listeners = new Set<Listener>();

export function readDatabase(): Readonly<DatabaseState> {
  return state;
}

export function updateDatabase<TResult>(recipe: (draft: DatabaseState) => TResult): TResult {
  const draft = structuredClone(state);
  const result = recipe(draft);
  state = draft;
  persist(state);
  listeners.forEach((listener) => listener(state));
  return result;
}

export function resetDatabase(): void {
  state = createInitialState();
  persist(state);
  listeners.forEach((listener) => listener(state));
}

export function subscribeToDatabase(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
