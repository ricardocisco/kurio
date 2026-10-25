import { expect, test, type Page } from '@playwright/test';

import { catalogCards, DEMO_USERS, openApp, signIn } from '../support/app';

const favoriteToggle = (page: Page, name: string) =>
  page
    .getByRole('button', { name: `Favoritar ${name}` })
    .locator('visible=true')
    .first();

const detailFavoriteToggle = (page: Page, isMobile: boolean) =>
  isMobile
    ? favoriteToggle(page, 'Emerald Ape #042')
    : page.getByRole('button', { name: /^(Favoritar|Favoritado)$/ });

test.describe('Favorites', () => {
  test('asks guests to sign in and persists favorites for the user', async ({ page, isMobile }) => {
    await openApp(page, '/nfts/emerald-ape-0042');
    await detailFavoriteToggle(page, isMobile).click();

    await expect(page).toHaveURL(/\/login\?redirect=/);
    await signIn(page, DEMO_USERS.nova);
    await expect(page).toHaveURL(/\/nfts\/emerald-ape-0042/);

    const toggle = detailFavoriteToggle(page, isMobile);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' && response.url().includes('/me/favorites/'),
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect((await saved).ok()).toBe(true);
    await expect(page.getByTestId('live-announcer')).toHaveText(
      'Emerald Ape #042 adicionado à lista de interesse.',
    );

    await page.reload();
    await expect(detailFavoriteToggle(page, isMobile)).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/account/favorites');
    const list = page.getByRole('region', { name: 'Lista de interesse' });
    await expect(list.getByRole('heading', { level: 3 })).toHaveText([
      'Emerald Ape #042',
      'Golden Beat #207',
    ]);

    const removed = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' && response.url().includes('/me/favorites/'),
    );
    await favoriteToggle(page, 'Emerald Ape #042').click();
    await expect(list.getByRole('heading', { level: 3 })).toHaveText(['Golden Beat #207']);
    expect((await removed).ok()).toBe(true);
    await page.reload();
    await expect(list.getByRole('heading', { level: 3 })).toHaveText(['Golden Beat #207']);
  });

  test('applies the change optimistically and rolls back when the API fails', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/login?redirect=%2Fnfts%2Femerald-ape-0042', 'favorite-failure');
    await signIn(page, DEMO_USERS.nova);

    const toggle = detailFavoriteToggle(page, isMobile);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Não foi possível atualizar seus favoritos.')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await page.evaluate(() => window.__kurioMocks?.setScenario('default'));
    await page.reload();
    await expect(detailFavoriteToggle(page, isMobile)).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles from the catalog card', async ({ page, isMobile }) => {
    await openApp(page, '/login?redirect=%2F');
    await signIn(page, DEMO_USERS.nova);

    const card = catalogCards(page).first();
    if (!isMobile) await card.hover();
    const toggle = card.getByRole('button', { name: 'Favoritar Emerald Ape #042' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    const goldenBeat = catalogCards(page).filter({ hasText: 'Golden Beat #207' });
    await expect(
      goldenBeat.getByRole('button', { name: 'Favoritar Golden Beat #207' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps favorites isolated per user', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Faccount%2Ffavorites');
    await signIn(page, DEMO_USERS.rafa);

    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible();
    await expect(page.getByText('Golden Beat #207')).toHaveCount(0);
  });
});
