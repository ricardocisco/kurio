import { expect, test, type Locator, type Page } from '@playwright/test';

import { catalogCardNames, catalogCards, openApp } from '../support/app';

const FIRST_PAGE_FIGMA_ORDER = [
  'Emerald Ape #042',
  'Sage Nomad #009',
  'Neon Vessel #552',
  'Cosmic Bloom #118',
  'Violet Nomad #314',
  'Ivory Baron #088',
  'Golden Beat #207',
  'Golden Pulse #233',
  'Golden Signal #160',
];

async function filtersPanel(page: Page, isMobile: boolean): Promise<Locator> {
  if (!isMobile) return page.getByRole('complementary', { name: 'Filtros do catálogo' });
  await page.getByRole('button', { name: /^(Abrir filtros|Filtros \()/ }).click();
  return page.getByRole('dialog', { name: 'Filtros' });
}

async function closeFilters(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Ver resultados' }).click();
}

function resultsAnnouncement(page: Page) {
  return page.getByRole('status').filter({ hasText: /encontrad/ });
}

async function facetCount(option: Locator): Promise<number> {
  const text = (await option.textContent()) ?? '';
  return Number(/\((\d+)\)/.exec(text)?.[1]);
}

function parseEth(text: string): number {
  return Number(/([\d.]+) ETH/.exec(text)?.[1]);
}

test.describe('Catalog', () => {
  test('lists the first page in the Figma order', async ({ page }) => {
    await openApp(page);
    await expect(catalogCardNames(page)).toHaveText(FIRST_PAGE_FIGMA_ORDER);
  });

  test('combines filters, resets pagination and keeps state in the URL', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/?page=2');
    await expect(catalogCards(page)).toHaveCount(9);

    let panel = await filtersPanel(page, isMobile);
    const music = panel.getByRole('button', { name: /^Música/ });
    const expectedMusicCount = await facetCount(music);
    await music.click();

    await expect(page).toHaveURL(/categories=/);
    await expect(page).not.toHaveURL(/page=/);
    await expect(music).toHaveAttribute('aria-pressed', 'true');
    await closeFilters(page, isMobile);
    await expect(resultsAnnouncement(page)).toHaveText(
      `${expectedMusicCount} ${expectedMusicCount === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`,
    );

    panel = await filtersPanel(page, isMobile);
    const polygon = panel.getByRole('button', { name: /^Polygon/ });
    const expectedCombinedCount = await facetCount(polygon);
    await polygon.click();
    await closeFilters(page, isMobile);

    await expect(page).toHaveURL(/networks=/);
    await expect(resultsAnnouncement(page)).toContainText(String(expectedCombinedCount));
    await expect(page.getByRole('group', { name: 'Filtros ativos' })).toContainText('Polygon');

    await page.reload();
    await expect(page.getByRole('group', { name: 'Filtros ativos' })).toContainText('Música');
    await expect(page.getByRole('group', { name: 'Filtros ativos' })).toContainText('Polygon');
    await expect(resultsAnnouncement(page)).toContainText(String(expectedCombinedCount));
  });

  test('sorts by price', async ({ page }) => {
    await openApp(page);
    await page.getByRole('combobox', { name: 'Ordenar por:' }).click();
    await page.getByRole('option', { name: 'Menor preço' }).click();

    await expect(page).toHaveURL(/sort=price-asc/);
    await expect(catalogCardNames(page).first()).not.toHaveText(FIRST_PAGE_FIGMA_ORDER[0]!);

    const prices = (await catalogCards(page).getByText(/ETH/).allTextContents()).map(parseEth);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('paginates and restores the page through history and refresh', async ({ page }) => {
    await openApp(page);
    await expect(catalogCardNames(page).first()).toHaveText('Emerald Ape #042');

    await page
      .getByRole('navigation', { name: 'Paginação do catálogo' })
      .getByRole('button', { name: 'Página 2' })
      .click();
    await expect(page).toHaveURL(/page=2/);
    await expect(catalogCardNames(page).first()).not.toHaveText('Emerald Ape #042');
    const secondPageFirstItem = await catalogCardNames(page).first().textContent();

    await page.goBack();
    await expect(page).not.toHaveURL(/page=2/);
    await expect(catalogCardNames(page).first()).toHaveText('Emerald Ape #042');

    await page.goForward();
    await expect(catalogCardNames(page).first()).toHaveText(secondPageFirstItem ?? '');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('searches by name and shows the empty state', async ({ page, isMobile }) => {
    if (isMobile) {
      await openApp(page);
      await page.getByRole('searchbox', { name: 'Explorar coleções' }).fill('golden');
    } else {
      await openApp(page);
      await page.getByRole('button', { name: 'Buscar NFTs' }).click();
      await page.getByRole('searchbox', { name: 'Termo de busca' }).fill('golden');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    }

    await expect(page).toHaveURL(/q=golden/);
    await expect(catalogCardNames(page)).toHaveText([/Golden/, /Golden/, /Golden/]);

    await openApp(page, '/?q=nada-por-aqui');
    await expect(
      page.getByRole('status').filter({ hasText: 'Nenhum NFT encontrado' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(catalogCards(page)).toHaveCount(9);
  });

  test('ignores out-of-order responses and shows the latest filters', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Covered on desktop; the drawer adds no extra behavior here.');
    await openApp(page, '/', 'out-of-order');
    await expect(catalogCards(page)).toHaveCount(9);

    const panel = await filtersPanel(page, false);
    const music = panel.getByRole('button', { name: /^Música/ });
    const gaming = panel.getByRole('button', { name: /^Jogos/ });
    const gamingCount = await facetCount(gaming);

    await music.click();
    await expect(music).toHaveAttribute('aria-pressed', 'true');
    await gaming.click();
    await music.click();

    await expect(page).toHaveURL(/categories=%5B%22gaming%22%5D/);
    await expect(resultsAnnouncement(page)).toHaveText(new RegExp(`^${gamingCount} NFT`));
    await page.waitForTimeout(1_800);
    await expect(resultsAnnouncement(page)).toHaveText(new RegExp(`^${gamingCount} NFT`));
    await expect(page.getByRole('group', { name: 'Filtros ativos' })).not.toContainText('Música');
  });
});

test.describe('Catalog loading and failures', () => {
  test('shows skeletons on a slow network', async ({ page }) => {
    await openApp(page, '/', 'slow');
    await page.reload();
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
    await expect(catalogCards(page)).toHaveCount(9, { timeout: 10_000 });
  });

  test('recovers from a transient server error with automatic retries', async ({ page }) => {
    await openApp(page, '/', 'server-error');
    await expect(catalogCards(page)).toHaveCount(9, { timeout: 10_000 });
  });

  test('shows an error with retry when the catalog is down', async ({ page }) => {
    await openApp(page, '/', 'catalog-down');
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o catálogo' });
    await expect(alert).toBeVisible({ timeout: 10_000 });

    await page.evaluate(() => window.__kurioMocks?.setScenario('default'));
    await alert.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(catalogCards(page)).toHaveCount(9);
  });

  test('shows the empty catalog state', async ({ page }) => {
    await openApp(page, '/', 'empty-catalog');
    await expect(
      page.getByRole('status').filter({ hasText: 'Nenhum NFT encontrado' }),
    ).toBeVisible();
  });
});
