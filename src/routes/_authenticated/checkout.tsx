import { createFileRoute } from '@tanstack/react-router';

import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage';

export const Route = createFileRoute('/_authenticated/checkout')({
  staticData: { mobileNavigation: 'none', hideFooterOnMobile: true },
  head: () => ({ meta: [{ title: 'Pagamento · Kurio' }] }),
  component: CheckoutPage,
});
