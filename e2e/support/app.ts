import { expect, type Page } from '@playwright/test';

/** Mock scenarios available in the app (see src/mocks/config/scenarios.ts). */
export type MockScenario =
  | 'default'
  | 'instant'
  | 'slow'
  | 'variable-latency'
  | 'out-of-order'
  | 'offline'
  | 'server-error'
  | 'catalog-down'
  | 'empty-catalog';

/**
 * Opens a page with a given mock scenario. The scenario is read by the mock layer from the URL and
 * kept in sessionStorage for the rest of the tab, so subsequent navigations keep it.
 */
export async function openApp(page: Page, path = '/', scenario: MockScenario = 'default') {
  const separator = path.includes('?') ? '&' : '?';
  await page.goto(`${path}${separator}scenario=${scenario}`);
  await expect.poll(() => page.evaluate(() => Boolean(window.__kurioMocks))).toBe(true);
}

export function catalogCards(page: Page) {
  return page.getByRole('region', { name: /catálogo|todos os nfts/i }).getByRole('article');
}

export function catalogCardNames(page: Page) {
  return catalogCards(page).getByRole('heading', { level: 3 });
}

declare global {
  interface Window {
    __kurioMocks?: {
      setScenario: (name: string) => void;
      getScenario: () => string;
      reset: () => void;
    };
  }
}
