import { httpClient, getJson, sendJson } from '@/shared/api/http-client';
import {
  authResultSchema,
  sessionSchema,
  type AuthResult,
  type LoginInput,
  type RegisterInput,
  type Session,
} from '@/shared/contracts/session';

export function fetchSession(signal?: AbortSignal): Promise<Session> {
  return getJson('/session', sessionSchema, { signal });
}

export function login(input: LoginInput): Promise<AuthResult> {
  return sendJson('post', '/session', authResultSchema, input);
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return sendJson('post', '/users', authResultSchema, input);
}

export async function logout(): Promise<void> {
  await httpClient.delete('/session');
}
