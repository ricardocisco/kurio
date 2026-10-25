# Camada de mocks (MSW)

O backend da Kurio é simulado no navegador com [MSW](https://mswjs.io). O app faz requisições reais via Axios (e, a partir da fase 3, via `socket.io-client`), e o service worker responde como uma API de verdade.

## Ativação

- `VITE_ENABLE_MOCKS=true` liga a camada (dev, build de demonstração e testes E2E).
- `src/app/bootstrap.ts` importa `src/mocks/browser.ts` dinamicamente e aguarda o worker ficar pronto antes do primeiro render, então nenhuma requisição escapa.
- O worker (`public/mockServiceWorker.js`) é publicado junto com o build; a Vercel o serve sem cache.

## Ordem dos handlers

1. `network.handlers.ts`: _catch-all_ que aplica latência e falhas do cenário. No caminho feliz devolve `undefined` e o MSW segue para o próximo handler.
2. Handlers por recurso (`catalog`, `newsletter`, ...).

## Banco simulado

- `db/database.ts` mantém o estado em memória e persiste em `localStorage` (`kurio.mocks.db`), então um refresh preserva carrinho, pedidos etc.
- `updateDatabase(recipe)` aplica mutações sobre uma cópia e só confirma se a função não lançar erro.
- `resetDatabase()` restaura integralmente as fixtures. Mudar o shape do estado exige incrementar `SCHEMA_VERSION` (snapshots antigos são descartados).

## Fixtures

- `fixtures/nfts.ts` gera 48 NFTs a partir de uma seed fixa (PRNG Mulberry32), com 9 categorias, 3 redes, raridades, edições (1/1, 1/10, 1/50, aberta) e preços de 0.02 a 12.30 ETH.
- A primeira página ordenada por "recentes" reproduz exatamente os 9 cards do frame do Figma.
- `fixtures/users.ts` traz 2 usuários com senha guardada como hash SHA-256 + salt (nunca em claro).
- As datas usam um relógio fixo (`MOCK_REFERENCE_DATE`), então "Novos lançamentos" nunca muda entre execuções.

## Cenários

Definidos em `config/scenarios.ts`. Cada cenário combina:

- `latency`: número fixo, faixa `{ min, max }` (determinística por seed) ou função da requisição;
- `faults`: regras por método/rota com efeito `network-error`, `timeout` ou `http` (status + code), opcionalmente limitadas às N primeiras ocorrências;
- `flags`: comportamentos de negócio lidos pelos handlers (ex.: `emptyCatalog`).

Seleção: `?scenario=<nome>` na URL (fica salvo no `sessionStorage` da aba), `VITE_MOCK_SCENARIO` como padrão, ou `window.__kurioMocks.setScenario(nome)` em tempo real.

## Controle externo

`window.__kurioMocks` (somente com mocks ligados):

| Método                                | Uso                                    |
| ------------------------------------- | -------------------------------------- |
| `scenarios`                           | Mapa nome → descrição                  |
| `getScenario()` / `setScenario(nome)` | Consulta/troca de cenário              |
| `reset()`                             | Restaura fixtures e contadores de rede |
| `expireSessions()`                    | Expira todas as sessões ativas         |

Esse controle altera apenas o "servidor". O app sempre observa a mudança por REST (ou, na fase 3, por eventos Socket.IO), nunca por escrita direta no cache.

## Testes

Cada teste Playwright roda em um contexto novo do navegador, com `localStorage` vazio: o banco simulado nasce das fixtures. O helper `openApp(page, path, scenario)` (em `e2e/support/app.ts`) abre a página já no cenário desejado.
