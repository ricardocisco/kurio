import type { Wallet } from '@/shared/contracts/wallets';

export function createWalletFixtures(): Record<string, Wallet[]> {
  return {
    'user-nova': [
      {
        id: 'wallet-nova-primary',
        role: 'primary',
        nickname: 'Principal',
        address: '0xA91F3c5D7e8B9a0F1c2D3e4F5a6B7c8D9e0FE82C',
        ensName: null,
        network: 'ethereum',
        provider: 'metamask',
        updatedAt: '2026-08-02T10:00:00.000Z',
      },
      {
        id: 'wallet-nova-secondary',
        role: 'secondary',
        nickname: 'Reserva',
        address: '0x5B2e8C1d9F7a3E6b4D0c2A8f1E9d7C5b3A1f0D2E',
        ensName: 'nova.kurio.eth',
        network: 'polygon',
        provider: 'coinbase',
        updatedAt: '2026-08-02T10:05:00.000Z',
      },
    ],
  };
}
