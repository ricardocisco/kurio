# Arquitetura

Documento vivo: cada fase do [plano](docs/PLAN.md) atualiza as seções correspondentes.

## Princípios

1. **Contratos primeiro.** Todo dado que cruza a rede tem um schema zod em `src/shared/contracts`. O mesmo schema tipa o cliente, valida a resposta em runtime e valida a requisição dentro do mock.
2. **Fluxo de dependências em uma direção:** `routes → features → shared`. `app/` compõe tudo (providers, layout, router). `shared/` nunca importa de `features/`.
3. **Mocks só na rede.** O app não sabe que o MSW existe: nenhum componente, hook ou cliente Axios contém dados fictícios ou caminhos alternativos. Uma regra de ESLint (`no-restricted-imports`) bloqueia `@/mocks` fora de `src/app/bootstrap.ts`.
4. **Estado na fonte certa:** estado do servidor no TanStack Query, estado navegável na URL (TanStack Router), estado efêmero de UI em `useState`. Sem store global.
5. **Código em inglês, interface em português.**

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

| Item                                                                    | Decisão                                                                                                                             |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Tokens de cor                                                           | O arquivo está em modo somente leitura (sem Dev Mode). As cores foram amostradas do protótipo renderizado e consolidadas em tokens. |
| Imagens                                                                 | As 4 ilustrações originais do arquivo foram exportadas e convertidas para WebP em 400/800/1200 px.                                  |
| Ícones sociais                                                          | Lucide v1 não traz mais ícones de marca; foram desenhados glifos simples em SVG.                                                    |
| Itens de navegação "Criadores" e "Aprenda", links de ajuda e "Ler mais" | Fora do escopo: mostram um aviso de "ainda não disponível" em vez de simular uma página.                                            |
| "Mercado"                                                               | Rota `/marketplace` com o catálogo completo (mesmo componente da home, com estado próprio na URL).                                  |
| Busca no desktop                                                        | O Figma só mostra o ícone. Ele abre um diálogo de busca que envia o termo para o Mercado.                                           |
| Rótulos "Contrato" e "Direitos autorais" (detalhe)                      | No Figma os textos estão trocados entre os rótulos; cada texto foi colocado sob o rótulo correspondente.                            |
| Compartilhar (detalhe)                                                  | Links reais de compartilhamento (LinkedIn, e-mail, X), em vez de ícones sem ação.                                                   |
| "Comprar" e "Favoritar" (detalhe)                                       | Desabilitados com aviso até as fases 2.4/2.5, para não aparentar sucesso.                                                           |
| Tab bar mobile                                                          | O botão central leva ao Mercado; "Favoritos" informa indisponibilidade até a fase 2.4.                                              |

## Limitações conhecidas (até aqui)

- Performance mobile abaixo da meta (76–79); causa e plano em `docs/PLAN.md`.

- A binding `@mswjs/socket.io-binding` exige MSW 2.x; o projeto fixa `msw@^2.15`.
- O chunk principal ainda é grande (~180 kB gzip) e o MSW adiciona ~165 kB gzip antes do primeiro render. Otimização prevista na fase 6.
