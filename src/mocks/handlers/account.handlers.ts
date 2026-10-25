import { http, HttpResponse } from 'msw';
import type { z } from 'zod';

import {
  changePasswordInputSchema,
  updateAvatarInputSchema,
  updateProfileInputSchema,
  type Profile,
} from '@/shared/contracts/profile';
import {
  secondaryWalletInputSchema,
  walletInputSchema,
  type Wallet,
  type WalletRole,
} from '@/shared/contracts/wallets';

import { readDatabase, updateDatabase } from '../db/database';
import { RESERVED_USERNAMES, type UserRecord } from '../fixtures/users';
import { apiPath } from '../utils/api-path';
import { authenticate } from '../utils/auth';
import { createSalt, hashPassword } from '../utils/crypto';
import { errorResponse, jsonResponse } from '../utils/responses';

function toProfile(user: UserRecord): Profile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    ensName: user.ensName,
    avatarUrl: user.avatarUrl,
    updatedAt: user.updatedAt,
  };
}

function validationError(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return errorResponse('VALIDATION_ERROR', 'Verifique os campos destacados.', { fieldErrors });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

function updateUser(userId: string, mutate: (user: UserRecord) => void): UserRecord {
  return updateDatabase((draft) => {
    const user = draft.users.find((item) => item.id === userId);
    if (!user) throw new Error(`Unknown user ${userId}`);
    mutate(user);
    user.updatedAt = new Date().toISOString();
    return structuredClone(user);
  });
}

function saveWallet(
  userId: string,
  role: WalletRole,
  wallet: Omit<Wallet, 'id' | 'role' | 'updatedAt'>,
): Wallet {
  return updateDatabase((draft) => {
    const wallets = draft.wallets[userId] ?? [];
    const saved: Wallet = {
      ...wallet,
      id:
        wallets.find((item) => item.role === role)?.id ??
        `wallet-${crypto.randomUUID().slice(0, 8)}`,
      role,
      updatedAt: new Date().toISOString(),
    };
    draft.wallets[userId] = [...wallets.filter((item) => item.role !== role), saved].sort((a) =>
      a.role === 'primary' ? -1 : 1,
    );
    return saved;
  });
}

export const accountHandlers = [
  http.get(apiPath('/me/profile'), ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    return jsonResponse<Profile>(toProfile(auth.user));
  }),

  http.patch(apiPath('/me/profile'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = updateProfileInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const { username, email } = parsed.data;
    if (username !== auth.user.username && RESERVED_USERNAMES.includes(username)) {
      return errorResponse('VALIDATION_ERROR', 'Verifique os campos destacados.', {
        fieldErrors: { username: ['Este nome de usuário é reservado. Escolha outro.'] },
      });
    }
    const others = readDatabase().users.filter((user) => user.id !== auth.user.id);
    if (others.some((user) => user.username === username)) {
      return errorResponse('USERNAME_ALREADY_TAKEN', 'Este nome de usuário já está em uso.', {
        fieldErrors: { username: ['Este nome de usuário já está em uso.'] },
      });
    }
    if (others.some((user) => user.email === email)) {
      return errorResponse('EMAIL_ALREADY_REGISTERED', 'Este e-mail já pertence a outra conta.', {
        fieldErrors: { email: ['Este e-mail já pertence a outra conta.'] },
      });
    }

    const user = updateUser(auth.user.id, (draft) => {
      draft.displayName = parsed.data.displayName;
      draft.username = username;
      draft.email = email;
      draft.ensName = parsed.data.ensName;
    });
    return jsonResponse<Profile>(toProfile(user));
  }),

  http.put(apiPath('/me/avatar'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = updateAvatarInputSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        parsed.error.issues[0]?.message ?? 'Imagem inválida.',
        {
          fieldErrors: { avatar: [parsed.error.issues[0]?.message ?? 'Imagem inválida.'] },
        },
      );
    }
    const user = updateUser(auth.user.id, (draft) => {
      draft.avatarUrl = parsed.data.dataUrl;
    });
    return jsonResponse<Profile>(toProfile(user));
  }),

  http.delete(apiPath('/me/avatar'), ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const user = updateUser(auth.user.id, (draft) => {
      draft.avatarUrl = null;
    });
    return jsonResponse<Profile>(toProfile(user));
  }),

  http.put(apiPath('/me/password'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = changePasswordInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const currentHash = await hashPassword(parsed.data.currentPassword, auth.user.passwordSalt);
    if (currentHash !== auth.user.passwordHash) {
      return errorResponse('VALIDATION_ERROR', 'Senha atual incorreta.', {
        fieldErrors: { currentPassword: ['Senha atual incorreta.'] },
      });
    }
    const passwordSalt = createSalt();
    const passwordHash = await hashPassword(parsed.data.newPassword, passwordSalt);
    updateUser(auth.user.id, (draft) => {
      draft.passwordSalt = passwordSalt;
      draft.passwordHash = passwordHash;
    });
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(apiPath('/me/wallets/primary'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const parsed = walletInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);
    return jsonResponse<Wallet>(saveWallet(auth.user.id, 'primary', parsed.data));
  }),

  http.put(apiPath('/me/wallets/secondary'), async ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    const body = await readJson(request);
    const parsed = secondaryWalletInputSchema.safeParse(body);
    if (!parsed.success) {
      const walletErrors = walletInputSchema.safeParse(
        (body as { wallet?: unknown } | null)?.wallet,
      );
      return walletErrors.success
        ? errorResponse('VALIDATION_ERROR', 'Dados da carteira inválidos.')
        : validationError(walletErrors.error);
    }

    const primary = (readDatabase().wallets[auth.user.id] ?? []).find(
      (wallet) => wallet.role === 'primary',
    );
    if (!primary) {
      return errorResponse('VALIDATION_ERROR', 'Cadastre a carteira principal primeiro.');
    }
    if (parsed.data.sameAsPrimary) {
      return jsonResponse<Wallet>(
        saveWallet(auth.user.id, 'secondary', {
          nickname: `${primary.nickname} (cópia)`,
          network: primary.network,
          provider: primary.provider,
          address: primary.address,
          ensName: primary.ensName,
        }),
      );
    }
    return jsonResponse<Wallet>(saveWallet(auth.user.id, 'secondary', parsed.data.wallet));
  }),

  http.delete(apiPath('/me/wallets/secondary'), ({ request }) => {
    const auth = authenticate(request);
    if (!auth.ok) return auth.response;
    updateDatabase((draft) => {
      draft.wallets[auth.user.id] = (draft.wallets[auth.user.id] ?? []).filter(
        (wallet) => wallet.role !== 'secondary',
      );
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
