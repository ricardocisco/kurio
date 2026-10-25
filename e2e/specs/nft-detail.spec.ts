import { expect, test, type Page } from '@playwright/test';

import { catalogCardNames, openApp } from '../support/app';

/**
 * Scenario 2 of the challenge: direct access to the detail page and non-existent resource,
 * plus editions, quantity limits, reviews and navigation back to the catalog.
 *
 * Fixture facts used here (deterministic seed):
 * - emerald-ape-0042: 1/50 edition (default) with 26 available, max 10 per order.
 * - sage-nomad-0009: 1/10 edition with only 2 available (stock limit below the per-order max).
 * - cosmic-bloom-0118: 1/1 edition sold out.
 */

const editionGroup = (page: Page) => page.getByRole('group', { name: 'Edição:' });

/** The visible pill is the label of a visually hidden native radio. */
const editionLabel = (page: Page, label: string) =>
  editionGroup(page)
    .locator('label')
    .filter({ hasText: new RegExp(`^${label.replace('/', '\\/')} `) });

test.describe('NFT detail', () => {
  test('opens directly from the URL with title, price and default edition', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/nfts/emerald-ape-0042');

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
    await expect(page).toHaveTitle('Emerald Ape #042 · Kurio');
    await expect(editionGroup(page).getByRole('radio', { name: /^1\/50/ })).toBeChecked();
    await expect(page.getByText('26 de 50 disponíveis', { exact: true })).toBeVisible();

    if (isMobile) {
      await expect(page.getByText('Total: 1.19 ETH')).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toContainText(
        'Início/Mercado/Emerald Ape #042',
      );
      await expect(page.getByText('1.19 ETH').locator('visible=true').first()).toBeVisible();
      await expect(page.getByText('19 avaliações de colecionadores')).toBeVisible();
    }
  });

  test('shows a not-found state for a non-existent NFT', async ({ page }) => {
    await openApp(page, '/nfts/nao-existe-9999');

    await expect(page.getByRole('heading', { name: 'NFT não encontrado' }).first()).toBeVisible();
    await expect(page).toHaveTitle('NFT não encontrado · Kurio');
    await page.getByRole('link', { name: 'Explorar o mercado' }).click();
    await expect(page).toHaveURL(/\/marketplace$/);
  });

  test('changes the edition, keeps it in the URL and after refresh', async ({ page }) => {
    await openApp(page, '/nfts/emerald-ape-0042');

    await editionLabel(page, 'ABERTA').click();
    await expect(page).toHaveURL(/edition=/);
    await expect(editionGroup(page).getByRole('radio', { name: /^ABERTA/ })).toBeChecked();
    await expect(page.getByText('Edição aberta', { exact: true })).toBeVisible();

    await page.reload();
    await expect(editionGroup(page).getByRole('radio', { name: /^ABERTA/ })).toBeChecked();
  });

  test('disables sold-out editions and explains a sold-out edition opened by link', async ({
    page,
  }) => {
    await openApp(page, '/nfts/cosmic-bloom-0118');
    const uniqueEdition = editionGroup(page).getByRole('radio', { name: /^1\/1 \(Esgotada\)/ });
    await expect(uniqueEdition).toBeDisabled();

    await openApp(page, '/nfts/cosmic-bloom-0118?edition=%22cosmic-bloom-0118-1-1%22');
    await expect(uniqueEdition).toBeChecked();
    await expect(
      page.getByText('Esta edição está esgotada. Escolha outra edição disponível.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' }).first()).toBeDisabled();
  });

  test('limits the quantity by stock and by the per-order rule', async ({ page, isMobile }) => {
    const stepper = (name: string) =>
      page.getByRole('group', { name: `Quantidade de ${name}` }).locator('visible=true');

    // Stock limit: only 2 units of the 1/10 edition are left.
    await openApp(page, '/nfts/sage-nomad-0009');
    await editionLabel(page, '1/10').click();
    const increase = stepper('Sage Nomad #009').getByRole('button', {
      name: 'Aumentar quantidade',
    });
    await increase.click();
    await expect(stepper('Sage Nomad #009').locator('output')).toHaveText('2');
    await expect(increase).toBeDisabled();
    await expect(
      page.getByText('Apenas 2 unidades disponíveis.').locator('visible=true'),
    ).toBeVisible();

    // Per-order limit: the 1/50 edition allows at most 10 per order.
    await openApp(page, '/nfts/emerald-ape-0042');
    const emeraldIncrease = stepper('Emerald Ape #042').getByRole('button', {
      name: 'Aumentar quantidade',
    });
    for (let quantity = 1; quantity < 10; quantity += 1) await emeraldIncrease.click();
    await expect(stepper('Emerald Ape #042').locator('output')).toHaveText('10');
    await expect(emeraldIncrease).toBeDisabled();
    await expect(page.getByText('Máximo de 10 por pedido.').locator('visible=true')).toBeVisible();
    if (isMobile) await expect(page.getByText('Total: 11.90 ETH')).toBeVisible();
  });

  test('loads reviews on demand and paginates them', async ({ page }) => {
    await openApp(page, '/nfts/emerald-ape-0042');

    await page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' }).click();
    const reviews = page.getByRole('tabpanel').getByRole('article');
    await expect(reviews).toHaveCount(5);
    await page.getByRole('button', { name: 'Ver mais avaliações' }).click();
    await expect(reviews).toHaveCount(10);
  });

  test('navigates from the catalog and back, keeping the catalog state', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/?page=2');
    const firstName = (await catalogCardNames(page).first().textContent()) ?? '';

    await catalogCardNames(page).first().getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: firstName })).toBeVisible();

    if (isMobile) await page.getByRole('button', { name: 'Voltar' }).click();
    else await page.goBack();

    await expect(page).toHaveURL(/page=2/);
    await expect(catalogCardNames(page).first()).toHaveText(firstName);
  });

  test('shows the detail skeleton on a slow network', async ({ page }) => {
    await openApp(page, '/', 'slow');
    await page.goto('/nfts/emerald-ape-0042');
    await expect(page.getByRole('status').filter({ hasText: 'Carregando NFT…' })).toBeAttached();
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
