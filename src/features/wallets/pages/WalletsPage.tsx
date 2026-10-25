import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/features/auth/hooks/use-session';
import { isApiError } from '@/shared/api/api-error';
import { RetryButton, StatusMessage } from '@/shared/components/StatusMessage';
import { shortenAddress, WALLET_PROVIDER_LABELS, type Wallet } from '@/shared/contracts/wallets';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';

import { WalletForm } from '../components/WalletForm';
import {
  useRemoveSecondaryWallet,
  useSavePrimaryWallet,
  useSaveSecondaryWallet,
  useWallets,
} from '../hooks/use-wallets';

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const;

function WalletSummary({ wallet }: { wallet: Wallet }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-card px-4 py-3 text-xs">
      <span className="text-sm font-bold">{wallet.nickname}</span>
      <span className="font-mono text-text-secondary">
        {wallet.ensName ?? shortenAddress(wallet.address)}
      </span>
      <span className="text-muted-foreground">
        Rede {NETWORK_LABELS[wallet.network]} · {WALLET_PROVIDER_LABELS[wallet.provider]}
      </span>
    </div>
  );
}

function SecondaryWalletSection({
  userId,
  primary,
  secondary,
}: {
  userId: string;
  primary: Wallet | undefined;
  secondary: Wallet | undefined;
}) {
  const checkboxId = useId();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  const save = useSaveSecondaryWallet(userId);
  const remove = useRemoveSecondaryWallet(userId);

  const showError = (error: unknown) =>
    toast.error(isApiError(error) ? error.message : 'Não foi possível salvar a carteira.');

  const handleAdd = () => {
    if (!sameAsPrimary) {
      setMode('edit');
      return;
    }
    save.mutate(
      { sameAsPrimary: true },
      { onSuccess: () => toast.success('Carteira secundária salva.'), onError: showError },
    );
  };

  return (
    <section aria-labelledby="secondary-wallet-title" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="secondary-wallet-title" className="text-sm font-bold">
            Carteira secundária
          </h2>
          {!secondary && mode === 'view' && (
            <p className="text-xs text-muted-foreground">
              Você ainda não adicionou uma carteira secundária.
            </p>
          )}
        </div>
        {!secondary && mode === 'view' && (
          <div className="flex items-center gap-4 text-xs">
            <label htmlFor={checkboxId} className="flex items-center gap-2">
              <input
                id={checkboxId}
                type="checkbox"
                className="size-4 accent-[var(--kurio-copper)]"
                checked={sameAsPrimary}
                disabled={!primary}
                onChange={(event) => setSameAsPrimary(event.target.checked)}
              />
              Igual à carteira principal
            </label>
            <Button
              variant="link"
              size="sm"
              disabled={!primary || save.isPending}
              onClick={handleAdd}
            >
              Adicionar
            </Button>
          </div>
        )}
      </header>

      {!primary && (
        <p className="text-xs text-muted-foreground">Cadastre a carteira principal primeiro.</p>
      )}

      {secondary && mode === 'view' && (
        <div className="flex flex-col gap-3">
          <WalletSummary wallet={secondary} />
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={() => setMode('edit')}>
              Editar carteira secundária
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => toast.info('Carteira secundária removida.'),
                  onError: showError,
                })
              }
            >
              Remover carteira secundária
            </Button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <WalletForm
          wallet={secondary}
          ariaLabel="Carteira secundária"
          submitLabel="Salvar carteira secundária"
          isSaving={save.isPending}
          onCancel={() => setMode('view')}
          onSubmit={(values, onError) =>
            save.mutate(
              { sameAsPrimary: false, wallet: values },
              {
                onSuccess: () => {
                  setMode('view');
                  toast.success('Carteira secundária salva.');
                },
                onError,
              },
            )
          }
        />
      )}
    </section>
  );
}

export function WalletsPage() {
  const { user } = useSession();
  const userId = user?.id ?? 'guest';
  const wallets = useWallets(userId);
  const savePrimary = useSavePrimaryWallet(userId);

  if (wallets.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (wallets.isError) {
    return (
      <StatusMessage
        variant="error"
        title="Não foi possível carregar suas carteiras"
        description={isApiError(wallets.error) ? wallets.error.message : undefined}
        action={
          <RetryButton onRetry={() => void wallets.refetch()} isRetrying={wallets.isRefetching} />
        }
      />
    );
  }

  const primary = wallets.data.items.find((wallet) => wallet.role === 'primary');
  const secondary = wallets.data.items.find((wallet) => wallet.role === 'secondary');

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Carteiras</h1>
      <section aria-labelledby="primary-wallet-title" className="flex flex-col gap-4">
        <header>
          <h2 id="primary-wallet-title" className="text-sm font-bold">
            Carteira principal
          </h2>
          <p className="text-xs text-muted-foreground">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </header>
        <WalletForm
          key={primary?.updatedAt ?? 'new'}
          wallet={primary}
          ariaLabel="Carteira principal"
          submitLabel="Salvar carteira"
          isSaving={savePrimary.isPending}
          onSubmit={(values, onError) =>
            savePrimary.mutate(values, {
              onSuccess: () => toast.success('Carteira principal salva.'),
              onError,
            })
          }
        />
      </section>
      <Separator />
      <SecondaryWalletSection userId={userId} primary={primary} secondary={secondary} />
    </div>
  );
}
