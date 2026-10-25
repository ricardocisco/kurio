# Kurio: plano de execução

Plano de trabalho para o desafio **NFT Marketplace** (Figma "Frontend Challenge", página _Marketplace de NFTs GreenMint_, marca **Kurio**).
Este arquivo é o roteiro vivo do projeto. Marque os itens conforme forem concluídos.

> Regra de ouro: cada fatia é entregue **funcionando de ponta a ponta** (contrato → mock MSW → API → hook → UI → teste E2E) antes de começar a próxima. Nada de tela "só visual".

---

## 1. Critérios eliminatórios (checar a cada PR)

- [ ] Toda a stack obrigatória participa de verdade (React, TS, TanStack Router e Query, Axios, REST, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright, Lighthouse).
- [ ] Fluxos principais funcionam (compra e conta), sem atalhos visuais.
- [ ] A compra só é confirmada com resposta da simulação (`order.updated` com `status: confirmed`).
- [ ] Nenhum dado vaza entre usuários (cache limpo, socket desconectado e eventos descartados no logout).
- [ ] Eventos chegam **sempre** pelo `socket.io-client` (nunca setters, callbacks ou escrita direta no cache vindos dos mocks).
- [ ] Testes E2E executáveis com `npm run test:e2e`.

## 2. Inventário do Figma

| Frame                            | Node      | Tamanho     | Observações                                                                                                             |
| -------------------------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| Desktop / Início                 | `2:2`     | 1440 × 3668 | Hero com carrossel, sidebar de filtros, grid 3 colunas, paginação, banners, "Diário da Cunhagem", footer                |
| Desktop / Detalhes do NFT        | `10:244`  | 1440        | Galeria com 4 miniaturas, edições (1/1, 1/10, 1/50, aberta), quantidade, comprar, favoritar, abas, "Mais desta coleção" |
| Desktop / Carrinho de NFTs       | `11:1278` | 1440        | Tabela de itens, cupom, resumo (subtotal, desconto, taxa de rede, total), "Colecionadores também viram"                 |
| Desktop / Pagamento              | `11:2862` | 1440        | Formulário do colecionador, resumo, carteira e rede, "Confirmar compra"                                                 |
| Desktop / Confirmação de Pedido  | `11:4385` | 1440 × 1080 | Modal "Thank you" com ID da transação, itens, taxa, total, "Ver no Etherscan"                                           |
| Desktop / Login                  | `9:115`   | 1440        | Dialog sobre a home, abas "Entrar \| Criar conta"                                                                       |
| Desktop / Cadastro               | `9:1022`  | 1440        | Mesmo dialog, aba "Criar conta"                                                                                         |
| Desktop / Perfil do Colecionador | `9:1238`  | 1440 × 1080 | Menu lateral da conta, dados, avatar, alteração de senha                                                                |
| Desktop / Carteiras              | `9:1670`  | 1440 × 1080 | Carteira principal e secundária                                                                                         |
| Mobile / Início                  | `14:5226` | 390         | Busca + botão de filtros, hero, abas, grid 2 colunas em masonry, tab bar inferior                                       |
| Mobile / Detalhes do NFT         | `15:5536` | 390         | Imagem, rating, edições, barra fixa com quantidade, preço e "Comprar NFT"                                               |
| Mobile / Carrinho de NFTs        | `16:360`  | 390         | Lista de itens, cupom e resumo em sheet inferior                                                                        |
| Mobile / Pagamento               | `16:748`  | 390         | Carteira conectada, carteira e rede, total, "Confirmar compra"                                                          |
| Mobile / Login                   | `16:1022` | 390         | Tela cheia                                                                                                              |
| Mobile / Cadastro                | `16:1228` | 390         | Tela cheia                                                                                                              |

Sem frame mobile, mas obrigatórios em mobile: Perfil, Carteiras, Confirmação.

**Tokens extraídos** (amostrados do protótipo; o arquivo está em modo somente leitura, sem Dev Mode):

- Fonte única: **Roboto Mono** (400, 500, 700).
- Fundo `#150C0A`, superfície `#241613`, faixa do footer `#3A200F`.
- Primária (cobre) `#D08A4C`, com gradiente até `#B57742` nos CTAs mobile.
- Texto principal `#FDF9F5`, texto secundário bege `#BFA58C`.
- Container de 1200 px (margens de 120 px em 1440), header de 68 px, sidebar de 310 px.

**Assets:** as 4 ilustrações do arquivo foram exportadas e otimizadas para WebP em 400/800/1200 px (`public/images/nfts`).

## 3. Arquitetura (resumo)

Detalhes em [`ARCHITECTURE.md`](../ARCHITECTURE.md).

```
src/
  app/          bootstrap, providers, QueryClient, router, estilos globais
  routes/       rotas file-based do TanStack Router (finas: só ligam URL → página)
  features/     uma pasta por domínio: api/, components/, hooks/, model/, pages/
  shared/       contracts (zod), api (Axios + erros), lib (money, storage), ui (shadcn), layout, components
  mocks/        MSW: db em memória, fixtures, cenários, handlers REST, servidor Socket.IO simulado
e2e/            testes Playwright e baselines visuais
```

Convenções:

- Código, nomes de arquivos, variáveis, funções e tipos em **inglês**; textos de interface em **português** (como no Figma).
- Contratos definidos uma vez em `shared/contracts` com **zod** e reutilizados por API, hooks, UI e mocks.
- Componentes não conhecem Axios; hooks de feature não conhecem mocks (regra de ESLint impede importar `@/mocks` no app).
- Valores em ETH são `string` decimais e todo cálculo passa por `shared/lib/money.ts` (`decimal.js`). Nunca `number`.
- Query keys centralizadas por feature (`catalogKeys`, `cartKeys`...), sempre incluindo o escopo do usuário quando o dado é privado.

## 4. Fases

### Fase 0: Fundação ✅ (esta entrega)

- [x] Vite 8 + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`).
- [x] Tailwind CSS 4 + tokens do Figma + Roboto Mono local (`@fontsource`).
- [x] shadcn/ui configurado (`components.json`) com componentes adaptados à identidade.
- [x] TanStack Router (file-based, code splitting automático) com contexto tipado.
- [x] TanStack Query com política de cache e retry documentada.
- [x] Axios com normalização de erros (`ApiError` tipado por `code`).
- [x] MSW ativado por `VITE_ENABLE_MOCKS`, disponível no build de demonstração.
- [x] ESLint (type-checked, hooks, a11y, fronteira app ↔ mocks) e Prettier.
- [x] Playwright (desktop e mobile em Chromium), Lighthouse CI e `vercel.json` com rewrite de SPA.
- [ ] **Deploy na Vercel no primeiro dia** e validar MSW + Socket.IO + refresh de rotas em produção.

### Fase 1: Camada de mocks

- [x] Banco em memória com persistência em `localStorage` e `resetMockDatabase()`.
- [x] Fixtures determinísticas (48 NFTs, 9 categorias, 3 redes) e 2 usuários.
- [x] Seletor de cenário (`?scenario=`) e condições de rede (latência fixa/variável, falha, timeout, offline).
- [x] Handlers do catálogo (listagem com busca/filtros/ordenação/paginação, destaque, detalhe).
- [ ] Handlers de sessão (cadastro, login, `GET /session`, logout, expiração).
- [ ] Favoritos, carrinho, cotação, pedidos (idempotência), perfil, carteiras.
- [ ] Servidor Socket.IO simulado com `@mswjs/socket.io-binding` emitindo `nft.updated` e `order.updated`.
- [ ] Painel de debug (só com mocks ligados): trocar cenário, resetar estado, disparar eventos pelo socket.

### Fase 2: Fatias verticais

1. **Catálogo / Início e Mercado** ✅
   - [x] Estado da URL (`validateSearch` + zod): busca, aba, categorias, redes, faixa de preço, ordenação, página.
   - [x] Mudança de filtro reinicia a paginação; histórico do navegador restaura o estado.
   - [x] Respostas obsoletas canceladas (`AbortSignal` do Query no Axios) e `keepPreviousData` na paginação.
   - [x] Skeletons com shimmer, estado vazio, erro com "tentar novamente".
   - [x] Drawer de filtros no mobile, busca com debounce e tab bar inferior.
   - [x] Banners (levam ao Mercado filtrado), "Diário da Cunhagem" e newsletter integrada ao mock (sem fingir sucesso).
2. **Detalhe do NFT**: acesso direto, 404, edições indisponíveis, limite de quantidade, galeria.
3. **Autenticação**: login, cadastro (conflito 409), sessão após refresh, guards com `beforeLoad` e `redirect` de volta.
4. **Favoritos**: atualização otimista com rollback (a interação otimista obrigatória).
5. **Carrinho**: carrinho de visitante local, merge no login, cupom, resumo vindo da API.
6. **Checkout**: cotação revalidada, chave de idempotência em `sessionStorage`, pedido pendente recuperável.
7. **Confirmação**: recibo como snapshot do pedido.
8. **Perfil e carteiras**: formulários com erros da API, avatar, senha.

### Fase 3: Tempo real

- [ ] Envelope de evento `{ eventId, type, resource, resourceId, version, userId?, occurredAt, payload }`.
- [ ] Registro de `eventId` processados + última `version` por recurso (descarta duplicados e antigos).
- [ ] `nft.updated` atualiza catálogo, detalhe e carrinho via `queryClient.setQueryData` com checagem de versão.
- [ ] Reconexão → `invalidateQueries` dos recursos ativos (reconciliação com REST).
- [ ] Logout → `socket.disconnect()`, `queryClient.clear()` e descarte de eventos de outro `userId`.
- [ ] Cenário: NFT no carrinho muda de preço → aviso acessível → resumo atualizado → checkout bloqueia cotação desatualizada.

### Fase 4: Polimento visual e acessibilidade

- [ ] Fidelidade aos frames em 1440, 768 e 390 px.
- [ ] Foco visível, foco preso em dialogs/drawers, `aria-live` para mutations e eventos.
- [ ] Contraste ≥ 4.5:1 (ajustes documentados), estados que não dependem só de cor.
- [ ] Zoom de 200% sem overflow horizontal.

### Fase 5: Testes Playwright (escrever junto de cada fatia)

1. [x] Busca, filtros combinados, ordenação, paginação e histórico (inclui respostas fora de ordem).
2. [ ] Acesso direto ao detalhe e NFT inexistente.
3. [ ] Cadastro, login, expiração, logout e troca de usuário.
4. [ ] Favoritos com falha de mutation e rollback.
5. [ ] Carrinho: quantidades, remoção, cupom, persistência após refresh e login.
6. [ ] Compra completa até o recibo.
7. [ ] Pagamento recusado, clique repetido e timeout com recuperação do mesmo pedido.
8. [ ] Perfil, avatar, senha e carteiras com erros de validação.
9. [ ] Preço/disponibilidade alterados via Socket.IO durante o checkout.
10. [ ] Eventos duplicados ou antigos, desconexão e retomada de pedido pendente.
11. [ ] Teclado, foco de dialogs e validação de formulários.
12. [x] Skeletons em rede lenta, erro e nova tentativa (catálogo; repetir nas próximas telas).

- [ ] Regressão visual: início, detalhe, carrinho, pagamento (desktop e mobile), com dados estáveis e relógio fixo.

### Fase 6: Performance e documentação

- [ ] Lighthouse CI: início e detalhe, mobile e desktop, 3 execuções, mediana, relatórios HTML/JSON versionados em `docs/lighthouse/`.
- [ ] Registrar LCP, CLS, TBT e justificar o que ficar abaixo da meta (impacto do service worker do MSW e do socket).
- [ ] `README.md` completo e `ARCHITECTURE.md` com contratos, eventos, sessão, carrinho, cache, reconciliação e desvios do Figma.

### Linha de base (fim da fase 0)

Lighthouse desktop na home, build otimizado com mocks, mediana de 3 execuções: **Performance 98, Accessibility 96 → corrigido (alvo de toque do carrossel), Best Practices 100, SEO 100**; LCP ≈ 1,0 s, CLS 0,004, TBT < 30 ms. O perfil mobile e a página de detalhe serão medidos quando o detalhe estiver pronto.

## 5. Prioridade se o tempo apertar

1. Eliminatórios + um fluxo de compra completo com teste E2E.
2. Fidelidade visual e fluxos (40 pts).
3. Integração e estado (15 pts).
4. Tempo real, mocking e testes (10 pts cada).
5. Acessibilidade, performance e documentação (5 pts cada).

## 6. Riscos

| Risco                                                                 | Mitigação                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@mswjs/socket.io-binding` só intercepta WebSocket (sem long-polling) | Cliente com `transports: ['websocket']`; documentar a limitação           |
| A binding exige MSW 2.x (MSW 3 já existe)                             | Fixado `msw@^2.15`; reavaliar quando a binding suportar a v3              |
| Service worker do MSW pesa no Lighthouse                              | Registrar com `quiet`, servir o worker com cache, documentar o custo      |
| Precisão decimal                                                      | `decimal.js` em todos os cálculos, testes de formatação                   |
| Rotas com refresh na Vercel                                           | `vercel.json` com rewrite para `index.html`                               |
| Figma sem Dev Mode                                                    | Tokens amostrados do protótipo; ajustes documentados em `ARCHITECTURE.md` |
