import { http, HttpResponse } from 'msw';
import type { z } from 'zod';

import {
  loginInputSchema,
  registerInputSchema,
  type AuthResult,
  type Session,
} from '@/shared/contracts/session';

import { onScenarioChange } from '../config/scenarios';
import { readDatabase, updateDatabase } from '../db/database';
import { RESERVED_USERNAMES, type UserRecord } from '../fixtures/users';
import { apiPath } from '../utils/api-path';
import {
  authenticate,
  createSession,
  expireAllSessions,
  readBearerToken,
  revokeSession,
  toSessionUser,
} from '../utils/auth';
import { createSalt, hashPassword } from '../utils/crypto';
import { errorResponse, jsonResponse } from '../utils/responses';

onScenarioChange((name) => {
  if (name === 'session-expired') expireAllSessions();
});

function validationError(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return errorResponse('VALIDATION_ERROR', 'Verifique os campos destacados.', { fieldErrors });
}

function authResult(user: UserRecord): AuthResult {
  const session = createSession(user.id);
  return { token: session.token, expiresAt: session.expiresAt, user: toSessionUser(user) };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export const authHandlers = [
  http.post(apiPath('/users'), async ({ request }) => {
    const parsed = registerInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const { username, email, password } = parsed.data;
    if (RESERVED_USERNAMES.includes(username)) {
      return errorResponse('VALIDATION_ERROR', 'Verifique os campos destacados.', {
        fieldErrors: { username: ['Este nome de usuário é reservado. Escolha outro.'] },
      });
    }

    const { users } = readDatabase();
    if (users.some((user) => user.email === email)) {
      return errorResponse('EMAIL_ALREADY_REGISTERED', 'Este e-mail já possui uma conta.', {
        fieldErrors: { email: ['Este e-mail já possui uma conta. Entre ou use outro e-mail.'] },
      });
    }
    if (users.some((user) => user.username === username)) {
      return errorResponse('USERNAME_ALREADY_TAKEN', 'Este nome de usuário já está em uso.', {
        fieldErrors: { username: ['Este nome de usuário já está em uso.'] },
      });
    }

    const passwordSalt = createSalt();
    const user: UserRecord = {
      id: `user-${crypto.randomUUID()}`,
      username,
      displayName: username,
      email,
      avatarUrl: null,
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
      createdAt: new Date().toISOString(),
    };
    updateDatabase((draft) => {
      draft.users.push(user);
    });

    return jsonResponse<AuthResult>(authResult(user), { status: 201 });
  }),

  http.post(apiPath('/session'), async ({ request }) => {
    const parsed = loginInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const user = readDatabase().users.find((item) => item.email === parsed.data.email);
    const passwordHash = await hashPassword(parsed.data.password, user?.passwordSalt ?? 'unknown');
    if (user?.passwordHash !== passwordHash) {
      return errorResponse('INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }

    return jsonResponse<AuthResult>(authResult(user));
  }),

  http.get(apiPath('/session'), ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    return jsonResponse<Session>({
      user: toSessionUser(auth.user),
      expiresAt: auth.session.expiresAt,
    });
  }),

  http.delete(apiPath('/session'), ({ request }) => {
    const token = readBearerToken(request);
    if (token) revokeSession(token);
    return new HttpResponse(null, { status: 204 });
  }),
];
