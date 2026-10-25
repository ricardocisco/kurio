import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  checkoutFormSchema,
  type CheckoutFormOutput,
  type CheckoutFormValues,
} from '@/shared/contracts/checkout';
import type { SessionUser } from '@/shared/contracts/session';
import type { Wallet } from '@/shared/contracts/wallets';

import { readCheckoutDraft, saveCheckoutDraft } from './checkout-storage';

function defaultValues(user: SessionUser, wallets: Wallet[]): CheckoutFormValues {
  const primary = wallets.find((wallet) => wallet.role === 'primary') ?? wallets[0];
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: primary?.ensName?.replace(/\.eth$/, '') ?? '',
    referralCode: '',
    note: '',
    walletId: primary?.id ?? null,
    useOtherWallet: !primary,
    network: primary?.network ?? 'ethereum',
    provider: primary?.provider ?? 'metamask',
    address: primary?.address ?? '',
  };
}

export function useCheckoutForm(user: SessionUser, wallets: Wallet[]) {
  const form = useForm<CheckoutFormValues, unknown, CheckoutFormOutput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { ...defaultValues(user, wallets), ...readCheckoutDraft(user.id) },
    mode: 'onTouched',
  });

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values }) => saveCheckoutDraft(user.id, values),
      }),
    [form, user.id],
  );

  const selectWallet = (walletId: string) => {
    const wallet = wallets.find((item) => item.id === walletId);
    if (!wallet) return;
    form.setValue('walletId', wallet.id, { shouldDirty: true });
    form.setValue('useOtherWallet', false);
    form.setValue('network', wallet.network);
    form.setValue('provider', wallet.provider);
    form.setValue('address', wallet.address, { shouldValidate: form.formState.isSubmitted });
  };

  const useOtherWallet = () => {
    form.setValue('useOtherWallet', true, { shouldDirty: true });
    form.setValue('walletId', null);
    form.setValue('address', '');
  };

  return { form, selectWallet, useOtherWallet };
}
