import { env } from '@/shared/config/env';

/**
 * Mock scenarios. A scenario combines network conditions (latency/faults) with business flags
 * read by the handlers. Scenarios are selected with `?scenario=<name>` (kept per tab in
 * sessionStorage), with `VITE_MOCK_SCENARIO` as the default, or via `window.__kurioMocks`.
 */

interface LatencyContext {
  method: string;
  pathname: string;
  /** Sequential index of matching requests since the scenario was activated. */
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
  /** Matched against the request pathname (without the API base). */
  path: RegExp;
  effect: FaultEffect;
  /** Apply only to the first N matching requests (then recover). Omit to always apply. */
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

/**
 * Applies `?scenario=` from the URL the page was opened with. The bootstrap captures that URL
 * before the first render, because the router may normalize the search params afterwards.
 */
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
  try {
    window.sessionStorage.setItem(SCENARIO_STORAGE_KEY, name);
  } catch {
    // Ignored: the scenario still applies for the current page lifetime.
  }
  scenarioListeners.forEach((listener) => listener(name));
}

export function onScenarioChange(listener: (name: ScenarioName) => void): () => void {
  scenarioListeners.add(listener);
  return () => scenarioListeners.delete(listener);
}
