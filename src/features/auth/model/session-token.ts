import { setAuthTokenProvider } from '@/shared/api/http-client';
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '@/shared/lib/storage';

export function readSessionToken(): string | null {
  return readStorage<string>(STORAGE_KEYS.sessionToken);
}

export function saveSessionToken(token: string): void {
  removeStorage(STORAGE_KEYS.sessionExpired, 'session');
  writeStorage(STORAGE_KEYS.sessionToken, token);
}

export function clearSessionToken(): void {
  removeStorage(STORAGE_KEYS.sessionToken);
}

export function configureAuthTransport(): void {
  setAuthTokenProvider(readSessionToken);
}

export function markSessionExpired(): void {
  writeStorage(STORAGE_KEYS.sessionExpired, true, 'session');
}

export function consumeSessionExpired(): boolean {
  const wasExpired = readStorage<boolean>(STORAGE_KEYS.sessionExpired, 'session') === true;
  removeStorage(STORAGE_KEYS.sessionExpired, 'session');
  return wasExpired;
}
