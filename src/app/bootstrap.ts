import { env } from '@/shared/config/env';

/**
 * Enables the simulated backend before the app issues its first request.
 * The mock layer is loaded with a dynamic import, so it is a separate chunk that is only
 * downloaded when `VITE_ENABLE_MOCKS=true` (dev, demo build and E2E tests).
 */
export async function enableMocking(): Promise<void> {
  if (!env.VITE_ENABLE_MOCKS) return;
  const { startMockServiceWorker } = await import('@/mocks/browser');
  await startMockServiceWorker();
}
