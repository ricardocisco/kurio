import { setupWorker } from 'msw/browser';

import { initializeScenarioFromUrl } from './config/scenarios';
import { createMockControl } from './control';
import { handlers } from './handlers';

export async function startMockServiceWorker(options: { initialSearch: string }): Promise<void> {
  initializeScenarioFromUrl(options.initialSearch);
  const worker = setupWorker(...handlers);

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  window.__kurioMocks = createMockControl();
}
