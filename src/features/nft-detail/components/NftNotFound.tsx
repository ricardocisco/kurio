import { Link } from '@tanstack/react-router';

import { StatusMessage } from '@/shared/components/StatusMessage';
import { Button } from '@/shared/ui/button';

export function NftNotFound() {
  return (
    <section className="container-content py-16" aria-labelledby="nft-not-found-title">
      <h1 id="nft-not-found-title" className="sr-only">
        NFT não encontrado
      </h1>
      <StatusMessage
        variant="empty"
        title="NFT não encontrado"
        description="Este NFT não existe ou foi removido do mercado. Confira outras obras disponíveis."
        action={
          <Button asChild>
            <Link to="/marketplace">Explorar o mercado</Link>
          </Button>
        }
      />
    </section>
  );
}
