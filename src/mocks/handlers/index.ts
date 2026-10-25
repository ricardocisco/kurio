import { authHandlers } from './auth.handlers';
import { catalogHandlers } from './catalog.handlers';
import { favoritesHandlers } from './favorites.handlers';
import { networkHandlers } from './network.handlers';
import { newsletterHandlers } from './newsletter.handlers';

export const handlers = [
  ...networkHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...newsletterHandlers,
];
