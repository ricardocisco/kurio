import { createFileRoute } from '@tanstack/react-router';

import { AccountLayout } from '@/features/account/components/AccountLayout';

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountLayout,
});
