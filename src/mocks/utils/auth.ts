import type { SessionUser } from '@/shared/contracts/session';

import { readDatabase, updateDatabase, type SessionRecord } from '../db/database';
import type { UserRecord } from '../fixtures/users';

import { createToken } from './crypto';
import { errorResponse } from './responses';

export const SESSION_TTL_MS = 30 * 60 * 1000;
const EXPIRED_SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export function createSession(userId: string): SessionRecord {
  const session: SessionRecord = {
    token: createToken(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  updateDatabase((draft) => {
    const cleanupThreshold = Date.now() - EXPIRED_SESSION_RETENTION_MS;
    draft.sessions = draft.sessions.filter(
      (item) => new Date(item.expiresAt).getTime() > cleanupThreshold,
    );
    draft.sessions.push(session);
  });
  return session;
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

export function revokeSession(token: string): void {
  updateDatabase((draft) => {
    draft.sessions = draft.sessions.filter((session) => session.token !== token);
  });
}

export function expireAllSessions(): void {
  updateDatabase((draft) => {
    const past = new Date(Date.now() - 1000).toISOString();
    draft.sessions = draft.sessions.map((session) => ({ ...session, expiresAt: past }));
  });
}

type AuthenticationResult =
  { ok: true; user: UserRecord; session: SessionRecord } | { ok: false; response: Response };

export function authenticate(request: Request): AuthenticationResult {
  const token = readBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: errorResponse('UNAUTHENTICATED', 'Entre na sua conta para continuar.'),
    };
  }

  const { sessions, users } = readDatabase();
  const session = sessions.find((item) => item.token === token);
  if (!session) {
    return {
      ok: false,
      response: errorResponse('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.'),
    };
  }

  if (new Date(session.expiresAt) <= new Date()) {
    return {
      ok: false,
      response: errorResponse('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'),
    };
  }

  const user = users.find((item) => item.id === session.userId);
  if (!user) {
    return {
      ok: false,
      response: errorResponse('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.'),
    };
  }

  return { ok: true, user, session };
}
