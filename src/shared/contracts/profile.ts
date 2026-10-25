import { z } from 'zod';

import { ENS_NAME_PATTERN } from './wallets';
import { PASSWORD_MIN_LENGTH, passwordSchema, usernameSchema } from './session';

export const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  ensName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateProfileInputSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Informe seu nome de exibição.')
    .max(40, 'Use no máximo 40 caracteres.'),
  username: usernameSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe seu e-mail.')
    .pipe(z.email('Informe um e-mail válido.')),
  ensName: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => (value ? value.replace(/\.eth$/, '') : null))
    .nullable()
    .refine((value) => value === null || ENS_NAME_PATTERN.test(`${value}.eth`), {
      message: 'Use apenas letras minúsculas, números e hífen (mínimo 3 caracteres).',
    }),
});
export type UpdateProfileInput = z.input<typeof updateProfileInputSchema>;

export const PASSWORD_HINT = `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`;

export const AVATAR_MAX_BYTES = 300 * 1024;
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const updateAvatarInputSchema = z.object({
  dataUrl: z
    .string()
    .regex(
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/,
      'Envie uma imagem PNG, JPG ou WebP.',
    )
    .refine(
      (value) => Math.ceil(((value.length - value.indexOf(',') - 1) * 3) / 4) <= AVATAR_MAX_BYTES,
      {
        message: 'A imagem deve ter no máximo 300 KB.',
      },
    ),
});
export type UpdateAvatarInput = z.infer<typeof updateAvatarInputSchema>;

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual.',
  });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
