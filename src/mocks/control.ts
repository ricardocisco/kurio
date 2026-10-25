import { resetNetworkSimulation } from './config/network';
import {
  getActiveScenarioName,
  isScenarioName,
  SCENARIOS,
  setActiveScenario,
  type ScenarioName,
} from './config/scenarios';
import { resetDatabase } from './db/database';
import { expireAllSessions } from './utils/auth';

export interface MockControl {
  scenarios: Record<ScenarioName, string>;
  getScenario: () => ScenarioName;
  setScenario: (name: string) => void;
  reset: () => void;
  expireSessions: () => void;
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
    expireSessions: expireAllSessions,
  };
}

declare global {
  interface Window {
    __kurioMocks?: MockControl;
  }
}
