import { expect, test, type Page } from '@playwright/test';

import { DEMO_USERS, openApp, signIn, waitForRealtime } from '../support/app';

const NFT_ID = 'emerald-ape-0042';
const EDITION_ID = 'emerald-ape-0042-1-50';
const reviewDialog = (page: Page) => page.getByRole('dialog');
const visiblePrice = (page: Page, text: string) =>
  page.getByText(text).locator('visible=true').first();

async function setPrice(page: Page, price: string) {
  await page.evaluate(
    ([nftId, editionId, value]) => window.__kurioMocks?.setEditionPrice(nftId, editionId, value),
    [NFT_ID, EDITION_ID, price] as const,
  );
}

async function openReview(page: Page) {
  await openApp(page, '/login?redirect=%2Fcheckout');
  await signIn(page, DEMO_USERS.nova);
  await expect(page).toHaveURL(/\/checkout/);
  await waitForRealtime(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(reviewDialog(page).getByText(/Conectada: 0xA91F/)).toBeVisible();
}

test.describe('Realtime', () => {
  test('applies a live price change on the detail page without refetching', async ({ page }) => {
    await openApp(page, `/nfts/${NFT_ID}`);
    await expect(visiblePrice(page, '1.19 ETH')).toBeVisible();
    await waitForRealtime(page);

    let detailRequests = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === `/api/nfts/${NFT_ID}`) detailRequests += 1;
    });

    await setPrice(page, '3.15');
    await expect(visiblePrice(page, '3.15 ETH')).toBeVisible();
    expect(detailRequests).toBe(0);
  });

  test('ignores duplicated and out-of-order events', async ({ page }) => {
    await openApp(page, `/nfts/${NFT_ID}`);
    await waitForRealtime(page);
    await setPrice(page, '3.15');
    await expect(visiblePrice(page, '3.15 ETH')).toBeVisible();

    await page.evaluate((nftId) => {
      window.__kurioMocks?.realtime.replayLastEvent();
      window.__kurioMocks?.realtime.emitStaleNftEvent(nftId, '0.5');
    }, NFT_ID);
    await page.waitForTimeout(300);
    await expect(visiblePrice(page, '3.15 ETH')).toBeVisible();
    await expect(page.getByText('0.5 ETH')).toHaveCount(0);
  });

  test('warns about price changes of items already in the cart', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcart');
    await signIn(page, DEMO_USERS.nova);
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }),
    ).toBeVisible();
    await waitForRealtime(page);

    await setPrice(page, '2.5');
    await expect(
      page.getByText('O preço de Emerald Ape #042 mudou de 1.19 ETH para 2.50 ETH.').first(),
    ).toBeVisible();
    await expect(visiblePrice(page, '29.466 ETH')).toBeVisible();
  });

  test('re-quotes the review when a price changes and requires a new confirmation', async ({
    page,
  }) => {
    await openReview(page);
    await setPrice(page, '2.48');

    await expect(
      reviewDialog(page).getByRole('heading', { name: 'Valores atualizados' }),
    ).toBeVisible();
    await expect(reviewDialog(page).getByRole('alert')).toContainText(
      'O preço de Emerald Ape #042 mudou durante a revisão',
    );
    await reviewDialog(page)
      .getByRole('button', { name: 'Confirmar novos valores e pagar' })
      .click();
    await expect(page).toHaveURL(/\/orders\/ord-/, { timeout: 15_000 });
    await expect(page.getByText('2.48 ETH')).toBeVisible();
  });

  test('confirms the order through a pushed event and ignores events of other users', async ({
    page,
  }) => {
    await openReview(page);
    let orderPolls = 0;
    page.on('request', (request) => {
      if (request.method() === 'GET' && request.url().includes('/api/orders/ord-')) orderPolls += 1;
    });

    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    const pending = reviewDialog(page).getByText(/Pedido ord-.+ pendente/);
    await expect(pending).toBeVisible();
    const orderId = /ord-[\w-]+/.exec((await pending.textContent()) ?? '')?.[0] ?? '';
    await page.evaluate((id) => window.__kurioMocks?.realtime.emitForeignOrderEvent(id), orderId);
    await expect(
      reviewDialog(page).getByRole('heading', { name: 'Pagamento recusado' }),
    ).toHaveCount(0);

    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`), { timeout: 8_000 });
    expect(orderPolls).toBeLessThanOrEqual(2);
  });

  test('falls back to polling while disconnected and reconciles after reconnecting', async ({
    page,
  }) => {
    await openReview(page);
    await page.evaluate(() => window.__kurioMocks?.realtime.setAvailable(false));
    await expect(
      page.getByText('Atualizações em tempo real pausadas. Reconectando…'),
    ).toBeVisible();

    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expect(page).toHaveURL(/\/orders\/ord-/, { timeout: 15_000 });

    await page.goto(`/nfts/${NFT_ID}`);
    await page.evaluate(() => window.__kurioMocks?.realtime.setAvailable(true));
    await waitForRealtime(page);
    await expect(page.getByText('Atualizações em tempo real pausadas. Reconectando…')).toHaveCount(
      0,
    );
    await setPrice(page, '3.33');
    await expect(visiblePrice(page, '3.33 ETH')).toBeVisible();
  });
});
