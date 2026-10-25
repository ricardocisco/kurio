# Kurio · NFT Marketplace

Implementação do desafio frontend **NFT Marketplace** (layout no [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1)).
React + TypeScript com TanStack Router/Query, Axios, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse.

- Plano de execução e progresso: [`docs/PLAN.md`](docs/PLAN.md)
- Arquitetura, contratos e decisões: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Cenários e controle dos mocks: [`docs/MOCKS.md`](docs/MOCKS.md)

> Status: **fase 0 (fundação) concluída e fatia do catálogo funcionando**. As demais telas já existem nas rotas e informam que estão em desenvolvimento.

## Requisitos

- Node.js 22 ou superior (`.nvmrc`)
- npm 10 ou superior

## Setup

```bash
npm install
cp .env.example .env      # no Windows (PowerShell): Copy-Item .env.example .env
npm run dev               # http://localhost:5173 com mocks ativos
```

Na primeira execução do Playwright, instale o navegador: `npx playwright install chromium`.

## Variáveis de ambiente

| Variável             | Padrão                       | Descrição                                                                       |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`  | `true`                       | Ativa a camada MSW (REST e Socket.IO). Mantida ligada no build de demonstração. |
| `VITE_API_BASE_URL`  | `/api`                       | Base usada pelo Axios. Com mocks, o MSW intercepta essa origem.                 |
| `VITE_SOCKET_URL`    | `wss://realtime.kurio.local` | URL do Socket.IO (interceptada pelo MSW).                                       |
| `VITE_MOCK_SCENARIO` | `default`                    | Cenário padrão dos mocks (ver abaixo).                                          |

## Comandos

| Comando                                   | O que faz                                                       |
| ----------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                             | Desenvolvimento com mocks                                       |
| `npm run dev:no-mocks`                    | Desenvolvimento sem MSW (requer uma API real)                   |
| `npm run build`                           | Verificação de tipos + build otimizado                          |
| `npm run preview`                         | Serve o build em `http://localhost:4173`                        |
| `npm run typecheck`                       | Verificação de tipos                                            |
| `npm run lint` / `npm run lint:fix`       | ESLint (type-checked, React Hooks, a11y, fronteira app ↔ mocks) |
| `npm run format` / `npm run format:check` | Prettier                                                        |
| `npm run check`                           | typecheck + lint + format                                       |
| `npm run test:e2e`                        | Playwright (desktop e mobile, Chromium) sobre o build com mocks |
| `npm run test:e2e:ui`                     | Playwright em modo UI                                           |
| `npm run test:e2e:update`                 | Atualiza as baselines de regressão visual                       |
| `npm run test:e2e:report`                 | Abre o relatório HTML                                           |
| `npm run lighthouse`                      | Build + Lighthouse CI (desktop e mobile, 3 execuções cada)      |

## Cenários dos mocks

Selecione pela URL (vale para a aba inteira): `http://localhost:5173/?scenario=slow`.

| Cenário            | Efeito                                                    |
| ------------------ | --------------------------------------------------------- |
| `default`          | Sucesso com latência curta e variável (80–260 ms)         |
| `instant`          | Sem latência                                              |
| `slow`             | 2,5 s por resposta (skeletons)                            |
| `variable-latency` | 100 ms a 2 s, determinístico                              |
| `out-of-order`     | Listagem alterna 1,5 s e 150 ms (respostas fora de ordem) |
| `offline`          | Toda requisição falha na rede                             |
| `server-error`     | Listagem responde 503 duas vezes e depois se recupera     |
| `catalog-down`     | Listagem sempre responde 500                              |
| `empty-catalog`    | Catálogo vazio                                            |

Pelo console do navegador:

```js
__kurioMocks.scenarios; // lista com descrições
__kurioMocks.setScenario('slow'); // troca o cenário sem recarregar
__kurioMocks.reset(); // restaura todas as fixtures (recarregue a página em seguida)
```

## Reproduzindo fluxos de falha (catálogo)

1. **Rede lenta e skeletons:** abra `/?scenario=slow`.
2. **Falha transitória com retry automático:** `/?scenario=server-error`.
3. **Erro persistente e "Tentar novamente":** `/?scenario=catalog-down`, depois `__kurioMocks.setScenario('default')` e clique em "Tentar novamente".
4. **Respostas fora de ordem:** `/?scenario=out-of-order` e alterne filtros rapidamente. A tela sempre reflete o último filtro.
5. **Sem conexão:** `/?scenario=offline`.

## Credenciais fictícias

Serão adicionadas junto com a autenticação (fase 2.3).

## Deploy

Configurado para a Vercel (`vercel.json` com rewrite de SPA, cache dos assets e `mockServiceWorker.js` sem cache). Basta importar o repositório; o build usa `npm run build` e publica `dist/`.
