import { expect, test, type Page } from '@playwright/test';

import { DEMO_USERS, openApp, signIn } from '../support/app';

const FIXED_NOW = new Date('2026-09-20T15:00:00-03:00');

async function settle(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      Array.from(document.images, (image) =>
        image.complete
          ? Promise.resolve()
          : Promise.race([
              image.decode().catch(() => undefined),
              new Promise((resolve) => setTimeout(resolve, 1500)),
            ]),
      ),
    );
    await document.fonts.ready;
  });
  await page.waitForLoadState('networkidle');
}

async function snapshot(page: Page, name: string) {
  await settle(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    mask: [page.locator('[data-sonner-toaster]')],
  });
}

test.describe('Visual regression', () => {
  test.skip(
    process.platform !== 'linux' && !process.env.VISUAL_BASELINES,
    'Baselines are rendered on Linux; set VISUAL_BASELINES=1 to compare on this system.',
  );

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW);
  });

  test('home', async ({ page }) => {
    await openApp(page, '/', 'instant');
    await expect(page.getByText('Emerald Ape #042').locator('visible=true').first()).toBeVisible();
    await snapshot(page, 'home');
  });

  test('nft detail', async ({ page }) => {
    await openApp(page, '/nfts/emerald-ape-0042', 'instant');
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible();
    await snapshot(page, 'nft-detail');
  });

  test('cart', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcart', 'instant');
    await signIn(page, DEMO_USERS.nova);
    await expect(
      page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }),
    ).toBeVisible();
    await snapshot(page, 'cart');
  });

  test('checkout', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcheckout', 'instant');
    await signIn(page, DEMO_USERS.nova);
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();
    await snapshot(page, 'checkout');
  });
});
