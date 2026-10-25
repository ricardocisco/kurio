import { createFileRoute } from '@tanstack/react-router';

import { CartPage } from '@/features/cart/pages/CartPage';

export const Route = createFileRoute('/cart')({
  staticData: { mobileNavigation: 'none', hideFooterOnMobile: true },
  head: () => ({ meta: [{ title: 'Carrinho de NFTs · Kurio' }] }),
  component: CartPage,
});
