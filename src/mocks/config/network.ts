import { delay, HttpResponse } from 'msw';

import { errorResponse } from '../utils/responses';
import { createSeededRandom } from '../utils/random';

import {
  getActiveScenario,
  getActiveScenarioName,
  onScenarioChange,
  type FaultRule,
  type LatencyStrategy,
} from './scenarios';

/**
 * Network condition simulator. Runs before every API handler: applies the scenario latency and,
 * when a fault rule matches, short-circuits with a network error, an endless request (timeout)
 * or an HTTP error. Everything is deterministic for a given scenario and request sequence.
 */

const requestCounters = new Map<string, number>();
const faultHits = new Map<FaultRule, number>();
let random = createSeededRandom(hashString(getActiveScenarioName()));

onScenarioChange((name) => resetNetworkSimulation(name));

export function resetNetworkSimulation(seedName = getActiveScenarioName()): void {
  requestCounters.clear();
  faultHits.clear();
  random = createSeededRandom(hashString(seedName));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRequestIndex(key: string): number {
  const index = requestCounters.get(key) ?? 0;
  requestCounters.set(key, index + 1);
  return index;
}

function resolveLatency(
  strategy: LatencyStrategy,
  method: string,
  pathname: string,
  requestIndex: number,
): number {
  if (typeof strategy === 'number') return strategy;
  if (typeof strategy === 'function') return strategy({ method, pathname, requestIndex, random });
  return Math.round(strategy.min + random() * (strategy.max - strategy.min));
}

function findFault(method: string, pathname: string): FaultRule | undefined {
  return getActiveScenario().faults?.find((rule) => {
    if (rule.method && rule.method !== method) return false;
    if (!rule.path.test(pathname)) return false;
    const hits = faultHits.get(rule) ?? 0;
    if (rule.times !== undefined && hits >= rule.times) return false;
    faultHits.set(rule, hits + 1);
    return true;
  });
}

/**
 * Returns a Response when the request must fail, or `undefined` to let the real handler run.
 * `apiPathname` is the request path relative to the API base URL (e.g. "/nfts").
 */
export async function simulateNetwork(
  method: string,
  apiPathname: string,
): Promise<Response | undefined> {
  const scenario = getActiveScenario();
  const requestIndex = nextRequestIndex(`${method} ${apiPathname}`);
  const latency = resolveLatency(scenario.latency, method, apiPathname, requestIndex);
  if (latency > 0) await delay(latency);

  const fault = findFault(method, apiPathname);
  if (!fault) return undefined;

  switch (fault.effect.type) {
    case 'network-error':
      return HttpResponse.error();
    case 'timeout':
      await delay('infinite');
      return HttpResponse.error();
    case 'http':
      return errorResponse(fault.effect.code, 'Serviço temporariamente indisponível.', {
        status: fault.effect.status,
      });
  }
}
