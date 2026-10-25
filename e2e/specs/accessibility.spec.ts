import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { DEMO_USERS, openApp, signIn } from '../support/app';

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('[data-sonner-toaster]')
    .analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} -> ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  );
  expect(summary).toEqual([]);
}

const PUBLIC_PAGES = [
  { name: 'home', path: '/', ready: 'Todos os NFTs' },
  { name: 'marketplace', path: '/marketplace', ready: 'Todos os NFTs' },
  { name: 'detail', path: '/nfts/emerald-ape-0042', ready: 'Emerald Ape #042' },
  { name: 'login', path: '/login', ready: 'Esqueceu a senha?' },
  { name: 'register', path: '/register', ready: 'Criar conta' },
] as const;

test.describe('Accessibility audit', () => {
  for (const { name, path, ready } of PUBLIC_PAGES) {
    test(`has no WCAG A/AA violations on ${name}`, async ({ page }) => {
      await openApp(page, path, 'instant');
      await expect(page.getByText(ready).locator('visible=true').first()).toBeVisible();
      await expectNoViolations(page);
    });
  }

  const PRIVATE_PAGES = [
    { name: 'cart', path: '/cart', ready: 'Emerald Ape #042' },
    { name: 'checkout', path: '/checkout', ready: 'Confirmar compra' },
    { name: 'profile', path: '/account/profile', ready: 'Perfil do colecionador' },
    { name: 'wallets', path: '/account/wallets', ready: 'Carteira principal' },
    { name: 'favorites', path: '/account/favorites', ready: 'Golden Beat #207' },
  ] as const;

  for (const { name, path, ready } of PRIVATE_PAGES) {
    test(`has no WCAG A/AA violations on ${name}`, async ({ page }) => {
      await openApp(page, `/login?redirect=${encodeURIComponent(path)}`, 'instant');
      await signIn(page, DEMO_USERS.nova);
      await expect(page.getByText(ready).locator('visible=true').first()).toBeVisible();
      await expectNoViolations(page);
    });
  }

  test('has no violations in the checkout review dialog', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcheckout', 'instant');
    await signIn(page, DEMO_USERS.nova);
    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Revise seu pedido' }),
    ).toBeVisible();
    await expectNoViolations(page);
  });

  test('has no violations on the receipt', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcheckout', 'instant');
    await signIn(page, DEMO_USERS.nova);
    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Conectar carteira' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({ timeout: 15_000 });
    await expectNoViolations(page);
  });

  test('has no violations on error and empty states', async ({ page }) => {
    await openApp(page, '/', 'catalog-down');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoViolations(page);

    await openApp(page, '/', 'empty-catalog');
    await expect(page.getByText(/Nenhum NFT/).first()).toBeVisible();
    await expectNoViolations(page);
  });
});
