import { expect, type Page } from '@playwright/test';

export type MockScenario =
  | 'default'
  | 'instant'
  | 'slow'
  | 'variable-latency'
  | 'out-of-order'
  | 'offline'
  | 'server-error'
  | 'catalog-down'
  | 'favorite-failure'
  | 'price-change-at-checkout'
  | 'sold-out-at-checkout'
  | 'payment-declined'
  | 'order-timeout'
  | 'wallet-rejected'
  | 'wallet-disconnects'
  | 'session-expired'
  | 'empty-catalog';

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
      expireSessions: () => void;
      setEditionPrice: (nftId: string, editionId: string, price: string) => void;
      setEditionAvailability: (nftId: string, editionId: string, available: number) => void;
    };
  }
}

export const DEMO_USERS = {
  nova: { email: 'colecionador@kurio.dev', password: 'Kurio@123', displayName: 'Nova Sato' },
  rafa: { email: 'artista@kurio.dev', password: 'Kurio@456', displayName: 'Rafa Lima' },
} as const;

export function authForm(page: Page, name: 'Entrar' | 'Criar conta') {
  return page.getByRole('form', { name });
}

export async function signIn(
  page: Page,
  user: { email: string; password: string },
  { expectSuccess = true } = {},
) {
  const form = authForm(page, 'Entrar');
  await form.getByRole('textbox', { name: 'E-mail' }).fill(user.email);
  await form.getByLabel('Senha', { exact: true }).fill(user.password);
  await form.getByRole('button', { name: 'Entrar' }).click();
  if (expectSuccess) await expect(page).not.toHaveURL(/\/login/);
}

export async function expectSignedInAs(page: Page, displayName: string, isMobile: boolean) {
  if (isMobile) {
    await page.goto('/account/profile');
    await expect(page.getByText(`Conectado como ${displayName}`)).toBeVisible();
  } else {
    await expect(
      page.getByRole('button', { name: `Menu da conta de ${displayName}` }),
    ).toBeVisible();
  }
}

export async function signOut(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.goto('/account/profile');
    await page.getByRole('button', { name: 'Sair' }).click();
  } else {
    await page.getByRole('button', { name: /^Menu da conta de/ }).click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
  }
  await expect(page.getByText('Você saiu da sua conta.')).toBeVisible();
}
