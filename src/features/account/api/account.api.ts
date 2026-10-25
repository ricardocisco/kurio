import { getJson, httpClient, sendJson } from '@/shared/api/http-client';
import {
  profileSchema,
  type ChangePasswordInput,
  type Profile,
  type UpdateAvatarInput,
  type UpdateProfileInput,
} from '@/shared/contracts/profile';

export function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  return getJson('/me/profile', profileSchema, { signal });
}

export function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  return sendJson('patch', '/me/profile', profileSchema, input);
}

export function updateAvatar(input: UpdateAvatarInput): Promise<Profile> {
  return sendJson('put', '/me/avatar', profileSchema, input);
}

export function removeAvatar(): Promise<Profile> {
  return sendJson('delete', '/me/avatar', profileSchema);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await httpClient.put('/me/password', input);
}
