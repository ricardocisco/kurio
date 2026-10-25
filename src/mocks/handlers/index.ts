import { catalogHandlers } from './catalog.handlers';
import { networkHandlers } from './network.handlers';
import { newsletterHandlers } from './newsletter.handlers';

/** Order matters: the network simulator must run first for every API request. */
export const handlers = [...networkHandlers, ...catalogHandlers, ...newsletterHandlers];
