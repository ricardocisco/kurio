import { onScenarioChange } from './scenarios';

const consumed = new Set<string>();

onScenarioChange(() => consumed.clear());

export function consumeOnce(key: string): boolean {
  if (consumed.has(key)) return false;
  consumed.add(key);
  return true;
}

export function resetOneShots(): void {
  consumed.clear();
}
