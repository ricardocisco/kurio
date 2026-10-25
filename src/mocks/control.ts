import { resetNetworkSimulation } from './config/network';
import {
  getActiveScenarioName,
  isScenarioName,
  SCENARIOS,
  setActiveScenario,
  type ScenarioName,
} from './config/scenarios';
import { resetDatabase } from './db/database';

/**
 * Control surface for the simulated backend, exposed as `window.__kurioMocks` when mocks are on.
 * Used by the debug panel, by humans in the console and by Playwright (`page.evaluate`).
 * It only changes server-side state: the app always observes changes through REST or Socket.IO.
 */
export interface MockControl {
  scenarios: Record<ScenarioName, string>;
  getScenario: () => ScenarioName;
  setScenario: (name: string) => void;
  /** Restores fixtures and network counters. Reload the page afterwards to drop client caches. */
  reset: () => void;
}

export function createMockControl(): MockControl {
  return {
    scenarios: Object.fromEntries(
      Object.entries(SCENARIOS).map(([name, definition]) => [name, definition.description]),
    ) as Record<ScenarioName, string>,
    getScenario: getActiveScenarioName,
    setScenario: (name) => {
      if (!isScenarioName(name)) throw new Error(`Unknown mock scenario "${name}"`);
      setActiveScenario(name);
    },
    reset: () => {
      resetDatabase();
      resetNetworkSimulation();
    },
  };
}

declare global {
  interface Window {
    __kurioMocks?: MockControl;
  }
}
