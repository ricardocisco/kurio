import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { fieldInputClass, FormField } from '@/shared/components/FormField';
import { networkIdSchema } from '@/shared/contracts/nft';
import {
  WALLET_PROVIDER_LABELS,
  walletInputSchema,
  walletProviderSchema,
  type Wallet,
  type WalletInput,
  type WalletInputOutput,
} from '@/shared/contracts/wallets';
import { applyServerErrors } from '@/shared/forms/apply-server-errors';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const;
const WALLET_FIELDS = ['nickname', 'network', 'provider', 'address', 'ensName'] as const;

interface WalletFormProps {
  wallet: Wallet | undefined;
  submitLabel: string;
  isSaving: boolean;
  ariaLabel: string;
  onSubmit: (values: WalletInputOutput, onError: (error: unknown) => void) => void;
  onCancel?: () => void;
}

export function WalletForm({
  wallet,
  submitLabel,
  isSaving,
  ariaLabel,
  onSubmit,
  onCancel,
}: WalletFormProps) {
  const [formError, setFormError] = useState<string>();
  const form = useForm<WalletInput, unknown, WalletInputOutput>({
    resolver: zodResolver(walletInputSchema),
    defaultValues: {
      nickname: wallet?.nickname ?? '',
      network: wallet?.network ?? 'ethereum',
      provider: wallet?.provider ?? 'metamask',
      address: wallet?.address ?? '',
      ensName: wallet?.ensName ?? '',
    },
  });
  const { errors } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    onSubmit(values, (error) =>
      setFormError(applyServerErrors(error, WALLET_FIELDS, form.setError)),
    );
  });

  return (
    <form noValidate onSubmit={handleSubmit} aria-label={ariaLabel} className="flex flex-col gap-5">
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/60 px-3 py-2 text-xs text-destructive"
        >
          {formError}
        </p>
      )}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <FormField label="Apelido da carteira" required error={errors.nickname?.message}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={fieldInputClass}
              {...form.register('nickname')}
            />
          )}
        </FormField>
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
              spellCheck={false}
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={cn(fieldInputClass, 'font-mono')}
              {...form.register('address')}
            />
          )}
        </FormField>
        <FormField label="Tipo de carteira" required error={errors.provider?.message}>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-describedby={describedBy}
              className={cn(fieldInputClass, 'bg-background')}
              {...form.register('provider')}
            >
              {walletProviderSchema.options.map((provider) => (
                <option key={provider} value={provider}>
                  {WALLET_PROVIDER_LABELS[provider]}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Nome ENS" error={errors.ensName?.message} hint="Ex.: nova.kurio.eth">
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              autoCapitalize="none"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={fieldInputClass}
              {...form.register('ensName')}
            />
          )}
        </FormField>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Salvando…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
