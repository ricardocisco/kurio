import { Link } from '@tanstack/react-router';
import { WalletIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { CheckoutFormOutput, CheckoutFormValues } from '@/shared/contracts/checkout';
import { networkIdSchema } from '@/shared/contracts/nft';
import {
  shortenAddress,
  WALLET_PROVIDER_LABELS,
  walletProviderSchema,
  type Wallet,
} from '@/shared/contracts/wallets';
import { cn } from '@/shared/lib/cn';

import { fieldInputClass, FormField } from '@/shared/components/FormField';

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const;
const PROVIDER_BADGES = { walletconnect: 'W', metamask: 'M', coinbase: null } as const;

interface WalletSelectionProps {
  form: UseFormReturn<CheckoutFormValues, unknown, CheckoutFormOutput>;
  wallets: Wallet[];
  onSelectWallet: (walletId: string) => void;
  onUseOtherWallet: () => void;
  disabled?: boolean;
}

const cardClass =
  'flex cursor-pointer items-center gap-4 rounded-md bg-card px-4 py-3 transition-colors hover:bg-accent has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring';
const radioClass = 'size-4 shrink-0 accent-[var(--kurio-copper)]';

export function WalletSelection({
  form,
  wallets,
  onSelectWallet,
  onUseOtherWallet,
  disabled,
}: WalletSelectionProps) {
  const walletId = form.watch('walletId');
  const useOtherWallet = form.watch('useOtherWallet');
  const provider = form.watch('provider');
  const { errors } = form.formState;

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3" disabled={disabled}>
        <legend className="mb-3 flex w-full items-center justify-between text-sm font-bold">
          Carteira conectada
          <Link to="/account/wallets" className="text-xs font-bold text-primary hover:underline">
            Gerenciar carteiras
          </Link>
        </legend>
        {wallets.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Você ainda não cadastrou carteiras. Informe um endereço abaixo ou{' '}
            <Link to="/account/wallets" className="text-primary underline-offset-4 hover:underline">
              cadastre uma carteira
            </Link>
            .
          </p>
        )}
        {wallets.map((wallet) => (
          <label key={wallet.id} className={cardClass}>
            <input
              type="radio"
              name="checkout-wallet"
              className={radioClass}
              checked={!useOtherWallet && walletId === wallet.id}
              onChange={() => onSelectWallet(wallet.id)}
            />
            <span className="flex flex-col gap-0.5 text-xs">
              <span className="text-sm font-bold">{wallet.nickname}</span>
              <span className="text-text-secondary">
                {wallet.ensName ?? shortenAddress(wallet.address)}
              </span>
              <span className="text-muted-foreground">
                Rede {NETWORK_LABELS[wallet.network]} · {WALLET_PROVIDER_LABELS[wallet.provider]}
              </span>
            </span>
          </label>
        ))}
        <label className={cardClass}>
          <input
            type="radio"
            name="checkout-wallet"
            className={radioClass}
            checked={useOtherWallet}
            onChange={onUseOtherWallet}
          />
          <span className="text-xs font-medium">Usar outra carteira?</span>
        </label>
        {errors.walletId && <p className="text-xs text-destructive">{errors.walletId.message}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-4" disabled={disabled}>
        <legend className="mb-3 text-sm font-bold">Carteira e rede</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Rede" required error={errors.network?.message}>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                className={cn(fieldInputClass, 'bg-background')}
                {...form.register('network')}
              >
                {networkIdSchema.options.map((network) => (
                  <option key={network} value={network}>
                    {NETWORK_LABELS[network]}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Endereço da carteira" required error={errors.address?.message}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                placeholder="Endereço 0x da carteira"
                readOnly={!useOtherWallet}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={cn(fieldInputClass, 'font-mono')}
                {...form.register('address')}
              />
            )}
          </FormField>
        </div>
        <div role="radiogroup" aria-label="Tipo de carteira" className="flex flex-col gap-3">
          {walletProviderSchema.options.map((option) => (
            <label key={option} className={cn(cardClass, 'justify-between')}>
              <span className="flex items-center gap-3 text-xs">
                <span
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center rounded-full bg-background text-xs font-bold text-primary"
                >
                  {PROVIDER_BADGES[option] ?? <WalletIcon className="size-4" />}
                </span>
                {WALLET_PROVIDER_LABELS[option]}
              </span>
              <input
                type="radio"
                value={option}
                className={radioClass}
                checked={provider === option}
                onChange={() => form.setValue('provider', option, { shouldDirty: true })}
              />
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
