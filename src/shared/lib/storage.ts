/**
 * Safe wrappers around Web Storage. Storage can throw (private mode, quota, disabled cookies),
 * so every access is guarded and falls back gracefully.
 */
type StorageArea = 'local' | 'session';

function getArea(area: StorageArea): Storage | null {
  try {
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage<T>(key: string, area: StorageArea = 'local'): T | null {
  const storage = getArea(area);
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown, area: StorageArea = 'local'): void {
  const storage = getArea(area);
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: the app keeps working with in-memory state.
  }
}

export function removeStorage(key: string, area: StorageArea = 'local'): void {
  const storage = getArea(area);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignored on purpose, see readStorage.
  }
}

/** Namespaced storage keys used by the application (mocks use their own namespace). */
export const STORAGE_KEYS = {
  sessionToken: 'kurio.session.token',
  guestCart: 'kurio.cart.guest',
  pendingCheckout: 'kurio.checkout.pending',
} as const;
