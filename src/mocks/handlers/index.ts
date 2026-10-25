import { accountHandlers } from './account.handlers';
import { authHandlers } from './auth.handlers';
import { cartHandlers } from './cart.handlers';
import { catalogHandlers } from './catalog.handlers';
import { checkoutHandlers } from './checkout.handlers';
import { favoritesHandlers } from './favorites.handlers';
import { realtimeHandlers } from '../realtime/socket-server';

import { networkHandlers } from './network.handlers';
import { newsletterHandlers } from './newsletter.handlers';

export const handlers = [
  ...networkHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...newsletterHandlers,
  ...realtimeHandlers,
];
