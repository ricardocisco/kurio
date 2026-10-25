import { z } from 'zod';

import { isoDateTimeSchema } from './common';
import { networkIdSchema } from './nft';

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase']);
export type WalletProvider = z.infer<typeof walletProviderSchema>;

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
};

export const walletRoleSchema = z.enum(['primary', 'secondary']);
export type WalletRole = z.infer<typeof walletRoleSchema>;

export const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
export const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const ENS_NAME_PATTERN = /^[a-z0-9-]{3,}(\.[a-z0-9-]+)*\.eth$/;

export const walletSchema = z.object({
  id: z.string(),
  role: walletRoleSchema,
  nickname: z.string(),
  address: z.string(),
  ensName: z.string().nullable(),
  network: networkIdSchema,
  provider: walletProviderSchema,
  updatedAt: isoDateTimeSchema,
});
export type Wallet = z.infer<typeof walletSchema>;

export const walletsSchema = z.object({ items: z.array(walletSchema) });
export type Wallets = z.infer<typeof walletsSchema>;

export function isValidWalletAddress(
  address: string,
  network: z.infer<typeof networkIdSchema>,
): boolean {
  return network === 'solana'
    ? SOLANA_ADDRESS_PATTERN.test(address)
    : EVM_ADDRESS_PATTERN.test(address);
}

export function shortenAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export const walletInputSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(2, 'Informe um apelido para a carteira.')
      .max(24, 'Use no máximo 24 caracteres.'),
    network: networkIdSchema,
    provider: walletProviderSchema,
    address: z.string().trim().min(1, 'Informe o endereço da carteira.'),
    ensName: z
      .string()
      .trim()
      .toLowerCase()
      .transform((value) => value || null)
      .nullable()
      .refine((value) => value === null || ENS_NAME_PATTERN.test(value), {
        message: 'Use um nome ENS completo, por exemplo nova.eth.',
      }),
  })
  .superRefine((input, context) => {
    if (input.address && !isValidWalletAddress(input.address, input.network)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          input.network === 'solana'
            ? 'Informe um endereço Solana válido.'
            : 'Informe um endereço 0x válido (42 caracteres).',
      });
    }
  });
export type WalletInput = z.input<typeof walletInputSchema>;
export type WalletInputOutput = z.output<typeof walletInputSchema>;

export const secondaryWalletInputSchema = z.union([
  z.object({ sameAsPrimary: z.literal(true) }),
  z.object({ sameAsPrimary: z.literal(false), wallet: walletInputSchema }),
]);
export type SecondaryWalletInput = z.input<typeof secondaryWalletInputSchema>;
