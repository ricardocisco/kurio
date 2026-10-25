import { env } from '@/shared/config/env';

export async function enableMocking(): Promise<void> {
  if (!env.VITE_ENABLE_MOCKS) return;
  const initialSearch = window.location.search;
  const { startMockServiceWorker } = await import('@/mocks/browser');
  await startMockServiceWorker({ initialSearch });
}
