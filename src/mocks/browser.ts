import { setupWorker } from 'msw/browser';

import { createMockControl } from './control';
import { handlers } from './handlers';

/**
 * Starts the MSW service worker. Requests that do not target the API (assets, fonts, Vite HMR)
 * are bypassed. Resolves once the worker is ready, so no request escapes before interception.
 */
export async function startMockServiceWorker(): Promise<void> {
  const worker = setupWorker(...handlers);

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  window.__kurioMocks = createMockControl();
}
