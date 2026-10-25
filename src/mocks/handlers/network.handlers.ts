import { http } from 'msw';

import { simulateNetwork } from '../config/network';
import { apiPath, toApiPathname } from '../utils/api-path';

/**
 * Catch-all that runs before every API handler. It returns `undefined` on the happy path, which
 * makes MSW fall through to the next matching handler with the latency already applied.
 */
export const networkHandlers = [
  http.all(apiPath('/*'), async ({ request }) => {
    return simulateNetwork(request.method, toApiPathname(request.url));
  }),
];
