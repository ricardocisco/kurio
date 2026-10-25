import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sessionQueryOptions } from '@/features/auth/api/session.queries';
import { announce } from '@/shared/a11y/announce';
import type { Profile } from '@/shared/contracts/profile';

import { changePassword, removeAvatar, updateAvatar, updateProfile } from '../api/account.api';
import { profileQueryOptions } from '../api/profile.queries';

export function useProfile(userId: string) {
  return useQuery(profileQueryOptions(userId));
}

function useProfileWriter(userId: string) {
  const queryClient = useQueryClient();
  return (profile: Profile) => {
    queryClient.setQueryData(profileQueryOptions(userId).queryKey, profile);
    queryClient.setQueryData(sessionQueryOptions().queryKey, (session) =>
      session
        ? {
            ...session,
            user: {
              ...session.user,
              username: profile.username,
              displayName: profile.displayName,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
            },
          }
        : session,
    );
  };
}

export function useUpdateProfile(userId: string) {
  const writeProfile = useProfileWriter(userId);
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      writeProfile(profile);
      announce('Dados do perfil salvos.');
    },
  });
}

export function useUpdateAvatar(userId: string) {
  const writeProfile = useProfileWriter(userId);
  return useMutation({
    mutationFn: updateAvatar,
    onSuccess: (profile) => {
      writeProfile(profile);
      announce('Avatar atualizado.');
    },
  });
}

export function useRemoveAvatar(userId: string) {
  const writeProfile = useProfileWriter(userId);
  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: (profile) => {
      writeProfile(profile);
      announce('Avatar removido.');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => announce('Senha alterada.'),
  });
}
