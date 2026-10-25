import { getJson, httpClient, sendJson } from '@/shared/api/http-client';
import {
  walletSchema,
  walletsSchema,
  type SecondaryWalletInput,
  type Wallet,
  type WalletInput,
  type Wallets,
} from '@/shared/contracts/wallets';

export function fetchWallets(signal?: AbortSignal): Promise<Wallets> {
  return getJson('/me/wallets', walletsSchema, { signal });
}

export function savePrimaryWallet(input: WalletInput): Promise<Wallet> {
  return sendJson('put', '/me/wallets/primary', walletSchema, input);
}

export function saveSecondaryWallet(input: SecondaryWalletInput): Promise<Wallet> {
  return sendJson('put', '/me/wallets/secondary', walletSchema, input);
}

export async function removeSecondaryWallet(): Promise<void> {
  await httpClient.delete('/me/wallets/secondary');
}
