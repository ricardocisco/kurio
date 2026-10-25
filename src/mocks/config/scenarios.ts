import { env } from '@/shared/config/env';

interface LatencyContext {
  method: string;
  pathname: string;
  requestIndex: number;
  random: () => number;
}

export type LatencyStrategy =
  number | { min: number; max: number } | ((ctx: LatencyContext) => number);

export type FaultEffect =
  | { type: 'network-error' }
  | { type: 'timeout' }
  | { type: 'http'; status: number; code: 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR' };

export interface FaultRule {
  method?: string;
  path: RegExp;
  effect: FaultEffect;
  times?: number;
}

export interface ScenarioFlags {
  emptyCatalog?: boolean;
}

export interface ScenarioDefinition {
  description: string;
  latency: LatencyStrategy;
  faults?: FaultRule[];
  flags?: ScenarioFlags;
}

const DEFAULT_LATENCY = { min: 80, max: 260 };

export const SCENARIOS = {
  default: {
    description: 'Respostas de sucesso com latência variável curta (80-260 ms).',
    latency: DEFAULT_LATENCY,
  },
  instant: {
    description: 'Sem latência. Útil para depuração.',
    latency: 0,
  },
  slow: {
    description: 'Rede lenta: todas as respostas levam 2,5 s (exibe skeletons).',
    latency: 2500,
  },
  'variable-latency': {
    description: 'Latência variável e determinística entre 100 ms e 2 s.',
    latency: { min: 100, max: 2000 },
  },
  'out-of-order': {
    description:
      'Respostas fora de ordem: requisições ímpares da listagem demoram 1,5 s e as pares 150 ms.',
    latency: ({ pathname, requestIndex }) =>
      pathname === '/nfts' ? (requestIndex % 2 === 0 ? 1500 : 150) : DEFAULT_LATENCY.min,
  },
  offline: {
    description: 'Sem conexão: toda requisição falha na camada de rede.',
    latency: 0,
    faults: [{ path: /.*/, effect: { type: 'network-error' } }],
  },
  'server-error': {
    description: 'Falha transitória: a listagem responde 503 nas 2 primeiras tentativas.',
    latency: DEFAULT_LATENCY,
    faults: [
      {
        method: 'GET',
        path: /^\/nfts$/,
        effect: { type: 'http', status: 503, code: 'SERVICE_UNAVAILABLE' },
        times: 2,
      },
    ],
  },
  'catalog-down': {
    description: 'A listagem sempre responde 500 (estado de erro persistente).',
    latency: DEFAULT_LATENCY,
    faults: [
      {
        method: 'GET',
        path: /^\/nfts$/,
        effect: { type: 'http', status: 500, code: 'INTERNAL_ERROR' },
      },
    ],
  },
  'favorite-failure': {
    description:
      'Incluir ou remover favoritos falha com 503 após 600 ms (testa o rollback otimista).',
    latency: ({ pathname }) => (pathname.startsWith('/me/favorites/') ? 600 : DEFAULT_LATENCY.min),
    faults: [
      {
        method: 'PUT',
        path: /^\/me\/favorites\/.+$/,
        effect: { type: 'http', status: 503, code: 'SERVICE_UNAVAILABLE' },
      },
      {
        method: 'DELETE',
        path: /^\/me\/favorites\/.+$/,
        effect: { type: 'http', status: 503, code: 'SERVICE_UNAVAILABLE' },
      },
    ],
  },
  'session-expired': {
    description:
      'Expira a sessão ativa ao abrir a página (a próxima chamada autenticada recebe 401).',
    latency: DEFAULT_LATENCY,
  },
  'empty-catalog': {
    description: 'Catálogo sem nenhum NFT listado.',
    latency: DEFAULT_LATENCY,
    flags: { emptyCatalog: true },
  },
} satisfies Record<string, ScenarioDefinition>;

export type ScenarioName = keyof typeof SCENARIOS;

const SCENARIO_STORAGE_KEY = 'kurio.mocks.scenario';

export function isScenarioName(value: unknown): value is ScenarioName {
  return typeof value === 'string' && Object.hasOwn(SCENARIOS, value);
}

function defaultScenario(): ScenarioName {
  return isScenarioName(env.VITE_MOCK_SCENARIO) ? env.VITE_MOCK_SCENARIO : 'default';
}

function readSessionScenario(): ScenarioName | null {
  try {
    const stored = window.sessionStorage.getItem(SCENARIO_STORAGE_KEY);
    return isScenarioName(stored) ? stored : null;
  } catch {
    return null;
  }
}

let activeScenario: ScenarioName = readSessionScenario() ?? defaultScenario();
const scenarioListeners = new Set<(name: ScenarioName) => void>();

export function initializeScenarioFromUrl(initialSearch: string): void {
  const fromUrl = new URLSearchParams(initialSearch).get('scenario');
  if (isScenarioName(fromUrl)) setActiveScenario(fromUrl);
}

export function getActiveScenarioName(): ScenarioName {
  return activeScenario;
}

export function getActiveScenario(): ScenarioDefinition {
  return SCENARIOS[activeScenario];
}

export function getScenarioFlags(): ScenarioFlags {
  const scenario: ScenarioDefinition = SCENARIOS[activeScenario];
  return scenario.flags ?? {};
}

export function setActiveScenario(name: ScenarioName): void {
  activeScenario = name;
  persistScenario(name);
  scenarioListeners.forEach((listener) => listener(name));
}

function persistScenario(name: ScenarioName): void {
  try {
    window.sessionStorage.setItem(SCENARIO_STORAGE_KEY, name);
  } catch {
    return;
  }
}

export function onScenarioChange(listener: (name: ScenarioName) => void): () => void {
  scenarioListeners.add(listener);
  return () => scenarioListeners.delete(listener);
}
