import type { NftDetail } from '@/shared/contracts/nft';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { NftReviews } from './NftReviews';

export function NftDetailTabs({ nft }: { nft: NftDetail }) {
  return (
    <Tabs defaultValue="details" className="flex flex-col">
      <TabsList aria-label="Informações do NFT">
        <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        <TabsTrigger value="reviews">Avaliações de colecionadores ({nft.rating.count})</TabsTrigger>
      </TabsList>

      <TabsContent
        value="details"
        className="flex flex-col gap-4 text-xs leading-relaxed text-muted-foreground"
      >
        {nft.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>{nft.contract.storage}</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.contract.royaltyPercentage}% nas vendas
              secundárias, pagos automaticamente pelos mercados compatíveis.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              {nft.contract.address} · Contrato inteligente {nft.contract.standard} verificado.
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews">
        <NftReviews nftId={nft.id} />
      </TabsContent>
    </Tabs>
  );
}
