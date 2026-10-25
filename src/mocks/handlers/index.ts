import { authHandlers } from './auth.handlers';
import { catalogHandlers } from './catalog.handlers';
import { networkHandlers } from './network.handlers';
import { newsletterHandlers } from './newsletter.handlers';

export const handlers = [
  ...networkHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...newsletterHandlers,
];
