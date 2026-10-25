import { http } from 'msw';

import { simulateNetwork } from '../config/network';
import { apiPath, toApiPathname } from '../utils/api-path';

export const networkHandlers = [
  http.all(apiPath('/*'), async ({ request }) => {
    return simulateNetwork(request.method, toApiPathname(request.url));
  }),
];
