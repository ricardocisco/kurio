import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  VITE_ENABLE_MOCKS: booleanString,
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_SOCKET_URL: z.string().min(1).default('wss://realtime.kurio.local'),
  VITE_MOCK_SCENARIO: z.string().min(1).default('default'),
});

/**
 * Validated, typed runtime configuration.
 * Fails fast at startup instead of producing confusing runtime errors later.
 */
export const env = envSchema.parse(import.meta.env);

export type AppEnv = z.infer<typeof envSchema>;
