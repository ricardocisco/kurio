import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '@/shared/lib/storage';

export function readGuestCartId(): string | null {
  return readStorage<string>(STORAGE_KEYS.guestCart);
}

export function ensureGuestCartId(): string {
  const existing = readGuestCartId();
  if (existing) return existing;
  const created = crypto.randomUUID();
  writeStorage(STORAGE_KEYS.guestCart, created);
  return created;
}

export function clearGuestCartId(): void {
  removeStorage(STORAGE_KEYS.guestCart);
}
