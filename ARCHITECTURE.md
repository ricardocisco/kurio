# Arquitetura

Documento vivo: cada fase do [plano](docs/PLAN.md) atualiza as seções correspondentes.

## Princípios

1. **Contratos primeiro.** Todo dado que cruza a rede tem um schema zod em `src/shared/contracts`. O mesmo schema tipa o cliente, valida a resposta em runtime e valida a requisição dentro do mock.
2. **Fluxo de dependências em uma direção:** `routes → features → shared`. `app/` compõe tudo (providers, layout, router). `shared/` nunca importa de `features/`.
3. **Mocks só na rede.** O app não sabe que o MSW existe: nenhum componente, hook ou cliente Axios contém dados fictícios ou caminhos alternativos. Uma regra de ESLint (`no-restricted-imports`) bloqueia `@/mocks` fora de `src/app/bootstrap.ts`.
4. **Estado na fonte certa:** estado do servidor no TanStack Query, estado navegável na URL (TanStack Router), estado efêmero de UI em `useState`. Sem store global.
5. **Código em inglês, interface em português.**
6. **Código sem comentários.** Nomes de funções, tipos e testes carregam a intenção; as decisões ficam documentadas aqui.

## Estrutura

```
src/
├── app/                      Composição da aplicação
│   ├── bootstrap.ts          Liga o MSW (import dinâmico) antes do primeiro render
│   ├── App.tsx               QueryClientProvider + RouterProvider + Toaster
│   ├── query-client.ts       Política de cache/retry (ver abaixo)
│   ├── router.tsx            Router com contexto tipado { queryClient }
│   ├── layout/               Header, footer, tab bar mobile, SiteLayout
│   └── styles/globals.css    Tokens do Figma + Tailwind v4 + tema shadcn
├── routes/                   Rotas file-based (finas: search params, loader, head, página)
├── features/
│   ├── nfts/                 API, query keys e componentes de NFT (card, imagem)
│   ├── catalog/              Estado de busca na URL, filtros, grid, paginação
│   ├── home/                 Hero, destaque, banners, Diário da Cunhagem
│   └── newsletter/           Formulário do rodapé (mutation real no mock)
├── shared/
│   ├── api/                  Axios, ApiError, parseContract
│   ├── contracts/            Schemas zod e tipos (REST e, em breve, eventos)
│   ├── config/env.ts         Variáveis de ambiente validadas com zod
│   ├── lib/                  money (decimal.js), storage seguro, cn
│   ├── hooks/                useMediaQuery, useDebouncedCallback, useComingSoon
│   ├── components/           Componentes compostos reutilizáveis
│   └── ui/                   Primitivas shadcn/ui adaptadas à identidade Kurio
└── mocks/                    Backend simulado (ver docs/MOCKS.md)
    ├── browser.ts            setupWorker + window.__kurioMocks
    ├── config/               Cenários e simulador de rede
    ├── db/                   Banco em memória com persistência e reset
    ├── fixtures/             Dados determinísticos (seed fixa)
    ├── handlers/             Handlers REST por recurso
    └── utils/                Respostas de erro, projeções, PRNG
```

Cada feature segue a mesma forma: `api/` (funções de transporte + `queryOptions`), `model/` (regras puras, schemas de UI), `hooks/`, `components/` e `pages/`.

## Camada HTTP

- `httpClient` (Axios) com `baseURL`, timeout de 10 s, serialização de arrays como CSV e header `Authorization` vindo de um _token provider_ registrado pela feature de sessão.
- Toda falha vira `ApiError` com `code` tipado (`VALIDATION_ERROR`, `SESSION_EXPIRED`, `AVAILABILITY_CONFLICT`...), `kind` (`http`, `network`, `timeout`, `contract`), `status` e `fieldErrors`. A UI decide pelo `code`, nunca pela mensagem.
- `getJson` / `sendJson` validam a resposta com o schema do contrato. Divergência vira erro `contract`, em vez de renderizar dados quebrados.
- Cancelamentos (`AbortSignal` do TanStack Query) passam intactos pelo interceptor.

## Política de cache, retry e sincronização

| Item                   | Valor                               | Motivo                                                                    |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `staleTime` padrão     | 30 s                                | Catálogo muda pouco; eventos em tempo real cobrem preço e disponibilidade |
| `staleTime` destaques  | 5 min                               | Conteúdo editorial                                                        |
| `gcTime`               | 5 min                               | Voltar para uma página recente é instantâneo                              |
| Retry de queries       | até 2x, backoff 1 s → 2 s           | Somente erros transitórios (rede, timeout, 5xx). 4xx nunca                |
| Retry de mutations     | desligado                           | Evita duplicar escrita; pedidos usam chave de idempotência explícita      |
| `refetchOnWindowFocus` | ligado                              | Respeita o `staleTime`                                                    |
| Paginação              | `placeholderData: keepPreviousData` | Mantém a página anterior visível, sem salto de layout                     |

**Respostas obsoletas:** cada combinação de parâmetros tem sua própria query key (`['nfts', 'list', query]`). Ao mudar um filtro, o Query cancela a requisição anterior via `AbortSignal` (Axios aborta) e ignora qualquer resposta de uma key que não está mais ativa. Coberto pelo teste E2E com o cenário `out-of-order`.

**Prefetch:** os loaders das rotas iniciam o prefetch (inclusive no hover de links, `defaultPreload: 'intent'`) sem bloquear a navegação. A página renderiza na hora com skeletons.

## Catálogo: estado na URL

`features/catalog/model/catalog-search.ts` define o schema dos search params (`q`, `tab`, `categories`, `networks`, `minPrice`, `maxPrice`, `sort`, `page`):

- Valores inválidos caem no padrão (`.catch`) em vez de quebrar a página.
- Valores padrão são removidos da URL (`stripSearchParams`).
- `applyCatalogSearchPatch` zera a paginação em qualquer mudança que não seja a própria página.
- A busca digitada no mobile usa `replace` (o histórico não guarda cada tecla); filtros e páginas fazem `push`.

## Dinheiro (ETH)

- Valores trafegam como string decimal (`"26.846"`), validados por regex de até 18 casas.
- `shared/lib/money.ts` concentra soma, subtração, multiplicação, percentual e comparação com `decimal.js` (precisão 64, arredondamento half-up).
- `formatEth` exibe no mínimo 2 casas e preserva as demais sem arredondar valores da API (`1.19 ETH`, `0.016 ETH`, `26.846 ETH`).
- O slider de preço usa números apenas na interação; o valor aplicado volta a ser string com 2 casas.

## Contratos REST (implementados até aqui)

| Método | Rota                                                                            | Resposta                                   | Erros                                  |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| `GET`  | `/api/nfts?search&tab&categories&networks&minPrice&maxPrice&sort&page&pageSize` | `CatalogPage` (itens, paginação, facetas)  | 422 `VALIDATION_ERROR`                 |
| `GET`  | `/api/nfts/featured`                                                            | `FeaturedNfts` (slides do hero e destaque) | 404 `NOT_FOUND`                        |
| `GET`  | `/api/nfts/:nftId`                                                              | `NftDetail` (edições, galeria, contrato)   | 404 `NOT_FOUND`                        |
| `POST` | `/api/newsletter/subscriptions`                                                 | `NewsletterSubscription` (201)             | 422 `VALIDATION_ERROR`, 409 `CONFLICT` |

Envelope de erro (todas as rotas):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fieldErrors": { "email": ["…"] } } }
```

Facetas: a contagem de cada categoria considera todos os filtros ativos **exceto** o de categorias (o mesmo vale para redes), o padrão de busca facetada.

Detalhe do NFT:

| Método | Rota                            | Resposta                                       | Erros           |
| ------ | ------------------------------- | ---------------------------------------------- | --------------- |
| `GET`  | `/api/nfts/:nftId/reviews?page` | `NftReviewsPage` (5 por página)                | 404 `NOT_FOUND` |
| `GET`  | `/api/nfts/:nftId/related`      | `RelatedNfts` (até 10: mesma coleção primeiro) | 404 `NOT_FOUND` |

Próximos contratos (sessão, favoritos, carrinho, cotação, pedidos, perfil, carteiras e eventos Socket.IO) serão documentados aqui conforme as fases avançam.

## Sessão e autenticação

| Método   | Rota           | Resposta                                      | Erros                                                                             |
| -------- | -------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `POST`   | `/api/users`   | `AuthResult` (201: token, expiração, usuário) | 422 `VALIDATION_ERROR`, 409 `EMAIL_ALREADY_REGISTERED` / `USERNAME_ALREADY_TAKEN` |
| `POST`   | `/api/session` | `AuthResult`                                  | 422 `VALIDATION_ERROR`, 401 `INVALID_CREDENTIALS`                                 |
| `GET`    | `/api/session` | `Session`                                     | 401 `UNAUTHENTICATED` / `SESSION_EXPIRED`                                         |
| `DELETE` | `/api/session` | 204                                           | —                                                                                 |

- **Token:** opaco, enviado como `Authorization: Bearer` pelo Axios (o _token provider_ é registrado pela feature de auth, então `shared/` não depende dela). Fica no `localStorage` para sobreviver ao refresh; a senha nunca é armazenada no cliente. No mock, a sessão dura 30 min e a senha é guardada como SHA-256 com salt.
- **Estado:** a sessão é uma query (`['session']`, `staleTime` 60 s). Sem token, a query resolve `null` sem chamar a API.
- **Rotas privadas:** ficam sob o layout `_authenticated`, cujo `beforeLoad` revalida a sessão a cada navegação (`staleTime: 0`) e redireciona para `/login?redirect=<url atual>`. Checkout, pedidos, perfil e carteiras estão sob esse layout.
- **Expiração:** detectada (1) no guard ao navegar e (2) em qualquer resposta 401, pelo `SessionWatcher` (assina `onUnauthorized` do cliente HTTP). Ele encerra a sessão local, avisa o usuário e, se a página atual for privada, leva ao login com `reason=expired`. O aviso sobrevive a um refresh (`sessionStorage`) e o login devolve o usuário para a URL de origem.
- **Isolamento:** dados privados usam chaves `['private', userId, ...]`. Login, logout e troca de usuário cancelam e removem esse escopo inteiro; dados públicos (catálogo) continuam em cache.
- **Formulários:** os mesmos schemas zod validam no cliente (react-hook-form) e no mock. Erros da API chegam em `fieldErrors` e são aplicados ao campo correspondente (com foco no primeiro); os demais aparecem em um alerta do formulário.
- **Login social e "Esqueceu a senha?":** fora do escopo; informam indisponibilidade.

## Perfil e carteiras

| Método   | Rota                                                                                          | Resposta  | Erros                                                          |
| -------- | --------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| `GET`    | `/api/me/profile`                                                                             | `Profile` | 401                                                            |
| `PATCH`  | `/api/me/profile`                                                                             | `Profile` | 422, 409 `USERNAME_ALREADY_TAKEN` / `EMAIL_ALREADY_REGISTERED` |
| `PUT`    | `/api/me/avatar` (`{ dataUrl }`, até 300 KB)                                                  | `Profile` | 422                                                            |
| `DELETE` | `/api/me/avatar`                                                                              | `Profile` | —                                                              |
| `PUT`    | `/api/me/password`                                                                            | 204       | 422 (senha atual incorreta, regras da nova senha)              |
| `PUT`    | `/api/me/wallets/primary`                                                                     | `Wallet`  | 422 (endereço inválido para a rede)                            |
| `PUT`    | `/api/me/wallets/secondary` (`{ sameAsPrimary: true }` ou `{ sameAsPrimary: false, wallet }`) | `Wallet`  | 422 (sem carteira principal, dados inválidos)                  |
| `DELETE` | `/api/me/wallets/secondary`                                                                   | 204       | —                                                              |

- Perfil e carteiras ficam em `['private', userId, 'profile' | 'wallets']`; o checkout usa a mesma query de carteiras, então uma edição aparece no pagamento sem recarregar.
- Salvar o perfil ou o avatar também atualiza o usuário da query de sessão, então header e menu mostram o novo nome/avatar na hora.
- O avatar é recortado e reduzido no navegador (canvas, 256 px, WebP) antes do envio, para caber no limite da API e no `localStorage` do mock.
- Validação de endereço por rede: `0x` + 40 hexadecimais para Ethereum/Polygon, base58 para Solana. Os mesmos schemas validam formulário e mock.

## Checkout e pedidos

| Método   | Rota                                     | Resposta                                | Erros                                                                                                                                              |
| -------- | ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/me/wallets`                        | `Wallets`                               | 401                                                                                                                                                |
| `POST`   | `/api/checkout/quotes`                   | `CheckoutQuote` (201, válida por 5 min) | 409 `AVAILABILITY_CONFLICT`, 422 (carrinho vazio)                                                                                                  |
| `POST`   | `/api/checkout/wallet-connections`       | `WalletConnection` (201)                | 403 `WALLET_REJECTED`, 422 (endereço inválido)                                                                                                     |
| `DELETE` | `/api/checkout/wallet-connections/:id`   | 204                                     | —                                                                                                                                                  |
| `POST`   | `/api/orders` (header `Idempotency-Key`) | `Order` (201 novo, 200 repetição)       | 409 `QUOTE_OUTDATED` (com a cotação nova em `details.quote`), 409 `AVAILABILITY_CONFLICT`, 409 `WALLET_DISCONNECTED`, 409 `IDEMPOTENCY_KEY_REUSED` |
| `GET`    | `/api/orders/:id`                        | `Order`                                 | 404 (inexistente ou de outro usuário)                                                                                                              |

**Fluxo** (`useCheckoutFlow`, máquina de estados: `idle → quoting → review → submitting → pending → confirmed | declined`, com `failed` para erros):

1. "Confirmar compra" valida o formulário e cria uma **cotação**: preços atuais, cupom, taxa e total congelados por 5 minutos. A revisão mostra exatamente essa cotação.
2. O usuário **conecta a carteira** (simulada pela API: pode ser recusada) e pode desconectá-la. "Confirmar e pagar" só fica disponível com a carteira conectada.
3. **Envio:** `POST /orders` com uma `Idempotency-Key` gerada para aquela combinação de cotação, conexão e dados. O servidor recalcula o carrinho e compara com a cotação. Se algo mudou (preço, cupom, taxa, quantidade) ou a cotação expirou, responde `QUOTE_OUTDATED` com uma cotação nova; a interface destaca os itens alterados e exige "Confirmar novos valores e pagar" (com uma chave nova, pois o conteúdo mudou).
4. **Falhas transitórias** (timeout, rede, 5xx) reenviam automaticamente a mesma requisição com a mesma chave, até 3 tentativas, avisando "Verificando o mesmo pedido, sem criar outra compra". O servidor devolve o pedido já criado. O botão fica bloqueado durante o envio e um _ref_ impede envios concorrentes; mesmo um clique duplo que escape gera no máximo um pedido.
5. **Pendente:** o pedido nasce `pending` e é resolvido pelo servidor após ~2,5 s (`confirmed` ou, no cenário `payment-declined`, `declined`). O cliente recebe `order.updated` por Socket.IO; o polling só assume (1 s) quando o tempo real está desconectado, com uma verificação de segurança a cada 10 s quando conectado. Estados finais não mudam mais.
6. **Recuperação:** a tentativa (`chave + requisição + orderId`) fica no `localStorage`, por usuário. Ao recarregar a página, o checkout retoma o pedido pendente ou reenvia a mesma requisição com a mesma chave, sem duplicar a compra.
7. **Confirmação:** só com `status: confirmed` vindo da API o usuário vai para o recibo. O servidor baixa o estoque e remove do carrinho **apenas as quantidades compradas** (itens adicionados durante o processamento permanecem). Em recusa ou erro, o carrinho fica intacto.
8. **Sessão expirada:** os dados do formulário ficam em `sessionStorage` (por usuário). O 401 leva ao login com `reason=expired` e o retorno ao `/checkout` restaura o rascunho.

**Recibo:** renderizado só a partir do `Order` (snapshot de itens, preços, cupom, taxa, total, carteira e transação). Mudanças posteriores no catálogo não alteram o recibo. Hash e link do explorador são simulados.

## Tempo real (Socket.IO)

**Transporte.** `socket.io-client` (carregado sob demanda, fora do bundle inicial) conecta em `VITE_SOCKET_URL` só por WebSocket. No ambiente simulado, o MSW intercepta o WebSocket e `@mswjs/socket.io-binding` fala o protocolo Socket.IO (`src/mocks/realtime/socket-server.ts`). Trocar pelo servidor real exige só a URL.

**Contrato** (`shared/contracts/events.ts`, validado com zod na chegada): todo evento tem `eventId`, `type`, `resource`, `resourceId`, `version` (versão monotônica do recurso no servidor), `occurredAt`, `userId` (`null` = público) e `payload`.

| Evento                                      | Escopo             | Payload                                      | Efeito no cliente                                                                                                                                                                         |
| ------------------------------------------- | ------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`                               | público            | preço, `isSoldOut`, preço/estoque por edição | Atualiza detalhe, listas, destaques, relacionados e favoritos no cache; invalida o carrinho e avisa (toast + leitor de tela) se o item está nele; a revisão do checkout pede nova cotação |
| `order.updated`                             | privado            | `Order` completo                             | Grava no cache do pedido; o checkout segue para o recibo sem esperar o polling                                                                                                            |
| `session.subscribe` / `session.unsubscribe` | cliente → servidor | `{ token }`                                  | Associa a conexão ao usuário (validado no servidor); feito ao conectar, no login e no logout                                                                                              |

**Garantias de ordem e duplicidade.** `EventLedger` descarta evento com `eventId` já visto e evento com `version` menor ou igual à última aceita para o recurso. Além disso, cada atualização de cache só é aplicada se a versão do evento for maior que a do dado em cache, então uma resposta REST mais nova nunca é sobrescrita por um evento antigo. Eventos privados com `userId` diferente do usuário atual são ignorados, mesmo que cheguem por engano.

**Reconexão.** Ao reconectar, o cliente re-assina a sessão e invalida NFTs, carrinho e pedidos (eventos perdidos durante a queda são recuperados pelo REST, que é a fonte da verdade). Enquanto desconectado, aparece o aviso "Atualizações em tempo real pausadas" e o pedido pendente volta ao polling de 1 s. No logout, a conexão é desassociada e o ledger é zerado.

**Preço mudou durante a revisão.** Se chega `nft.updated` de um item da cotação aberta, o checkout pede uma cotação nova; se o total ou algum preço mudou, mostra "Valores atualizados" com o aviso e exige confirmar de novo. Se a edição esgotou, encaminha ao carrinho. O servidor continua validando a cotação no `POST /orders` (`QUOTE_OUTDATED`), então o evento só antecipa o aviso.

**Controles no console:** `__kurioMocks.realtime.setAvailable(false|true)`, `.replayLastEvent()`, `.emitStaleNftEvent(nftId, price)`, `.emitForeignOrderEvent(orderId)`, `.connectionCount()`.

## Carrinho

| Método   | Rota                      | Resposta                                          | Erros                                                     |
| -------- | ------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| `GET`    | `/api/cart`               | `Cart`                                            | 401 (sessão inválida)                                     |
| `POST`   | `/api/cart/items`         | `Cart`                                            | 404, 409 `AVAILABILITY_CONFLICT`, 422 (limite por pedido) |
| `PATCH`  | `/api/cart/items/:lineId` | `Cart` (`quantity` e/ou `acknowledgePriceChange`) | 404, 409, 422                                             |
| `DELETE` | `/api/cart/items/:lineId` | `Cart`                                            | —                                                         |
| `PUT`    | `/api/cart/coupon`        | `Cart`                                            | 422 `COUPON_INVALID` / `COUPON_EXPIRED`                   |
| `DELETE` | `/api/cart/coupon`        | `Cart`                                            | —                                                         |
| `POST`   | `/api/cart/merge`         | `Cart` (com aviso `lines-merged`)                 | 401                                                       |

- **Dono do carrinho:** com sessão, o carrinho é da conta (`['private', userId, 'cart']`); sem sessão, é um carrinho de visitante no servidor simulado, identificado por um UUID salvo no navegador e enviado no header `X-Guest-Cart-Id` (`['cart', 'guest', id]`). Assim o carrinho sobrevive a refresh nos dois casos e a API é a mesma.
- **União no login:** o `CartSessionSync` (montado na raiz) detecta o usuário recém-autenticado com um carrinho de visitante e chama `POST /cart/merge`. Quantidades repetidas são somadas e limitadas ao estoque e ao máximo por pedido; o carrinho de visitante é descartado depois.
- **Fonte da verdade:** toda mutation devolve o carrinho completo, calculado pela API (preço atual de cada edição, subtotal, desconto, taxa de rede e total), e a resposta substitui o cache. O cliente não soma valores.
- **Taxa de rede:** 0.01 ETH + 0.002 ETH por item distinto (reproduz os 0.016 ETH do Figma com 3 itens).
- **Avisos por item:** `price-changed` (preço atual diferente do preço quando o item entrou; resolvido com "Entendi"), `insufficient-stock` ("Ajustar quantidade") e `sold-out` ("Remover"). Estoque insuficiente ou esgotado bloqueia o checkout (`hasBlockingIssues`). Diminuir uma quantidade é sempre permitido, para o usuário conseguir resolver o aviso.
- Os controles `__kurioMocks.setEditionPrice` e `setEditionAvailability` alteram o servidor simulado; na fase 3 eles também emitirão `nft.updated` pelo Socket.IO.

## Favoritos (atualização otimista)

| Método   | Rota                       | Resposta                                   | Erros    |
| -------- | -------------------------- | ------------------------------------------ | -------- |
| `GET`    | `/api/me/favorites`        | `Favorites` (NFTs, mais recentes primeiro) | 401      |
| `PUT`    | `/api/me/favorites/:nftId` | `FavoriteChange` (idempotente)             | 401, 404 |
| `DELETE` | `/api/me/favorites/:nftId` | `FavoriteChange` (idempotente)             | 401      |

- A lista fica em `['private', userId, 'favorites']`, então some no logout e nunca aparece para outro usuário.
- **Fluxo otimista:** `onMutate` cancela buscas em andamento, guarda o estado anterior e aplica a mudança na hora; `onError` restaura o estado anterior e mostra um aviso; `onSettled` revalida com a API apenas quando a última mutation do grupo termina (cliques rápidos não fazem a lista "piscar").
- `PUT`/`DELETE` são idempotentes por recurso, então repetir a operação nunca duplica o favorito.
- A mudança é anunciada por um `LiveAnnouncer` global (`aria-live`), reutilizável pelos eventos em tempo real.
- O `NftCard` recebe a ação por _slot_ (`action`), assim `nfts` não depende de `favorites`.

## Detalhe do NFT

- **Carregamento:** o loader usa `ensureQueryData` (bloqueia a rota) e converte `NOT_FOUND` em `notFound()`, exibindo o `notFoundComponent` da rota. O `pendingComponent` (skeleton com o mesmo layout) aparece após 150 ms e fica pelo menos 400 ms, sem piscar. A página usa `useSuspenseQuery`, então continua inscrita no cache para receber atualizações (inclusive os eventos da fase 3).
- **Edição:** fica na URL (`?edition=`, com `replace`), então um link compartilhado abre a mesma edição. `resolveSelectedEdition` respeita a edição pedida, mesmo esgotada (para explicar o motivo), senão usa a padrão, senão a primeira disponível.
- **Quantidade:** sempre inteira e limitada por `min(disponível, máximo por pedido)`. O valor é recalculado a cada render, então se a disponibilidade cair (evento em tempo real) a quantidade acompanha. O motivo do limite aparece em texto.
- **Avaliações:** `useInfiniteQuery` carregado só quando a aba é aberta (o Radix monta apenas o painel ativo).
- **Layout mobile:** a rota declara `staticData.mobileNavigation = 'page-bar'`; o `SiteLayout` esconde a tab bar e reserva espaço para a barra fixa de compra.

## Acessibilidade (decisões já aplicadas)

- Link "Pular para o conteúdo", landmarks (`header`, `nav`, `main`, `aside`, `footer`) e headings ocultos onde o Figma não tem título visível.
- Filtros como botões `aria-pressed` com ícone de check, para que o estado não dependa só da cor.
- Card de NFT com _stretched link_: um único foco por card.
- Região `aria-live` anuncia carregamento, atualização e total de resultados; erros usam `role="alert"`.
- Pontos do carrossel com área de toque de 24 px (o ponto visual de 10 px foi mantido).
- Foco preso em dialog (busca) e drawer (filtros) pelo Radix; `prefers-reduced-motion` desliga shimmer e transições.

## Desvios e substituições em relação ao Figma

| Item                                                                    | Decisão                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens de cor                                                           | O arquivo está em modo somente leitura (sem Dev Mode). As cores foram amostradas do protótipo renderizado e consolidadas em tokens.                                                                                                       |
| Imagens                                                                 | As 4 ilustrações originais do arquivo foram exportadas e convertidas para WebP em 400/800/1200 px.                                                                                                                                        |
| Ícones sociais                                                          | Lucide v1 não traz mais ícones de marca; foram desenhados glifos simples em SVG.                                                                                                                                                          |
| Itens de navegação "Criadores" e "Aprenda", links de ajuda e "Ler mais" | Fora do escopo: mostram um aviso de "ainda não disponível" em vez de simular uma página.                                                                                                                                                  |
| "Mercado"                                                               | Rota `/marketplace` com o catálogo completo (mesmo componente da home, com estado próprio na URL).                                                                                                                                        |
| Busca no desktop                                                        | O Figma só mostra o ícone. Ele abre um diálogo de busca que envia o termo para o Mercado.                                                                                                                                                 |
| Login/cadastro                                                          | Rotas `/login` e `/register`. No desktop, o diálogo do Figma abre sobre a home (inerte ao fundo); no mobile, tela cheia como nos frames. Labels ficam visualmente ocultos (o Figma usa só placeholder) mas existem para leitores de tela. |
| Rótulos "Contrato" e "Direitos autorais" (detalhe)                      | No Figma os textos estão trocados entre os rótulos; cada texto foi colocado sob o rótulo correspondente.                                                                                                                                  |
| Compartilhar (detalhe)                                                  | Links reais de compartilhamento (LinkedIn, e-mail, X), em vez de ícones sem ação.                                                                                                                                                         |
| "Comprar" e "Favoritar" (detalhe)                                       | Desabilitados com aviso até as fases 2.4/2.5, para não aparentar sucesso.                                                                                                                                                                 |
| Tab bar mobile                                                          | O botão central leva ao Mercado; o coração leva à "Lista de interesse".                                                                                                                                                                   |

## Limitações conhecidas (até aqui)

- Performance mobile abaixo da meta (76–79); causa e plano em `docs/PLAN.md`.

- A binding `@mswjs/socket.io-binding` exige MSW 2.x; o projeto fixa `msw@^2.15`.
- O tempo real simulado roda dentro da aba (MSW): eventos só chegam à própria aba. Mudanças feitas em outra aba aparecem via REST (foco/reconexão). Com servidor real, todas as abas receberiam.
- O servidor simulado não guarda histórico para replay após queda; a reconciliação é feita por refetch.
- O chunk principal ainda é grande (~180 kB gzip) e o MSW adiciona ~165 kB gzip antes do primeiro render. Otimização prevista na fase 6.
