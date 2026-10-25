import { z } from 'zod';

import { isoDateTimeSchema } from './common';

export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: isoDateTimeSchema,
});
export type Session = z.infer<typeof sessionSchema>;

export const authResultSchema = sessionSchema.extend({ token: z.string().min(1) });
export type AuthResult = z.infer<typeof authResultSchema>;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.'));

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const USERNAME_PATTERN = /^[a-z0-9._]+$/;
export const PASSWORD_MIN_LENGTH = 8;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use pelo menos 3 caracteres.')
  .max(20, 'Use no máximo 20 caracteres.')
  .regex(USERNAME_PATTERN, 'Use apenas letras minúsculas, números, ponto ou sublinhado.');

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .regex(/[a-zA-Z]/, 'A senha precisa ter pelo menos uma letra.')
  .regex(/\d/, 'A senha precisa ter pelo menos um número.');

export const registerInputSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  });
export type RegisterInput = z.infer<typeof registerInputSchema>;
