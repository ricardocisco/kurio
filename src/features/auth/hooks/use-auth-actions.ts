import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { clearPrivateQueries } from '@/shared/api/private-scope';
import type { AuthResult, Session } from '@/shared/contracts/session';

import { login, logout, register } from '../api/auth.api';
import { sessionQueryOptions } from '../api/session.queries';
import { clearSessionToken, saveSessionToken } from '../model/session-token';

function startSession(queryClient: QueryClient, result: AuthResult): void {
  clearPrivateQueries(queryClient);
  saveSessionToken(result.token);
  const session: Session = { user: result.user, expiresAt: result.expiresAt };
  queryClient.setQueryData(sessionQueryOptions().queryKey, session);
}

export function endSession(queryClient: QueryClient): void {
  clearSessionToken();
  clearPrivateQueries(queryClient);
  queryClient.setQueryData(sessionQueryOptions().queryKey, null);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (result) => startSession(queryClient, result),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: (result) => startSession(queryClient, result),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await logout().catch(() => undefined);
      endSession(queryClient);
    },
  });
}
