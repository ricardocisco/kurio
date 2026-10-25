import { env } from '@/shared/config/env';

/**
 * Enables the simulated backend before the app issues its first request.
 * The mock layer is loaded with a dynamic import, so it is a separate chunk that is only
 * downloaded when `VITE_ENABLE_MOCKS=true` (dev, demo build and E2E tests).
 *
 * Measured trade-off: starting MSW in parallel with the first render made mobile LCP worse
 * (both downloads compete for bandwidth), so the app renders after the worker is ready.
 */
export async function enableMocking(): Promise<void> {
  if (!env.VITE_ENABLE_MOCKS) return;
  // Captured before anything else runs, so `?scenario=` is never lost to URL normalization.
  const initialSearch = window.location.search;
  const { startMockServiceWorker } = await import('@/mocks/browser');
  await startMockServiceWorker({ initialSearch });
}
