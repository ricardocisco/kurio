import { expect, test, type Page, type Response } from '@playwright/test';

import { DEMO_USERS, openApp, signIn, type MockScenario } from '../support/app';

const reviewDialog = (page: Page) => page.getByRole('dialog');
const isOrderPost = (response: Response) =>
  response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/orders';

async function openCheckout(page: Page, scenario: MockScenario = 'default') {
  await openApp(page, '/login?redirect=%2Fcheckout', scenario);
  await signIn(page, DEMO_USERS.nova);
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();
}

async function reviewAndConnect(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(
    reviewDialog(page).getByRole('heading', { name: 'Revise seu pedido' }),
  ).toBeVisible();
  await reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }).click();
  await expect(reviewDialog(page).getByText(/Conectada: 0xA91F/)).toBeVisible();
}

async function expectReceipt(page: Page) {
  await expect(page).toHaveURL(/\/orders\/ord-/, { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible();
}

test.describe('Checkout', () => {
  test('buys from the catalog to the confirmed receipt and removes only purchased quantities', async ({
    page,
  }) => {
    await openApp(page, '/login?redirect=%2Fnfts%2Femerald-ape-0042');
    await signIn(page, DEMO_USERS.nova);
    await page
      .getByRole('button', { name: /^Comprar( NFT)?$/ })
      .locator('visible=true')
      .click();
    await expect(page).toHaveURL(/\/cart$/);
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    await reviewAndConnect(page);
    await expect(reviewDialog(page).getByText('28.036 ETH')).toBeVisible();
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expect(reviewDialog(page).getByText(/Pedido ord-.+ pendente/)).toBeVisible();

    await page.evaluate(async () => {
      const token = JSON.parse(localStorage.getItem('kurio.session.token') ?? 'null') as string;
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nftId: 'golden-beat-0207',
          editionId: 'golden-beat-0207-open',
          quantity: 1,
        }),
      });
    });

    await expectReceipt(page);
    const receipt = page.getByRole('article', { name: 'Seus NFTs agora estão na sua carteira' });
    await expect(receipt.getByText('Emerald Ape #042')).toBeVisible();
    await expect(receipt.getByText('(x 3)')).toBeVisible();
    await expect(receipt.getByText('28.036 ETH').first()).toBeVisible();

    await page.goto('/cart');
    await expect(
      page.getByRole('button', { name: 'Remover Golden Beat #207 do carrinho' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Remover .+ do carrinho$/ })).toHaveCount(1);
  });

  test('keeps the receipt as an immutable snapshot', async ({ page }) => {
    await openCheckout(page);
    await reviewAndConnect(page);
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expectReceipt(page);

    await page.evaluate(() =>
      window.__kurioMocks?.setEditionPrice('emerald-ape-0042', 'emerald-ape-0042-1-50', '9.99'),
    );
    await page.reload();
    await expect(page.getByText('2.38 ETH')).toBeVisible();
    await expect(page.getByText('26.846 ETH').first()).toBeVisible();
  });

  test('validates the collector form before review', async ({ page }) => {
    await openCheckout(page);
    const displayName = page.getByRole('textbox', { name: 'Nome de exibição' });
    await displayName.fill('');
    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(displayName).toBeFocused();
    await expect(displayName).toHaveAccessibleDescription('Informe seu nome de exibição.');
    await expect(reviewDialog(page)).toHaveCount(0);
  });

  test('requires a new confirmation when the price changes during the purchase', async ({
    page,
  }) => {
    await openCheckout(page, 'price-change-at-checkout');
    await reviewAndConnect(page);
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(
      reviewDialog(page).getByRole('heading', { name: 'Valores atualizados' }),
    ).toBeVisible();
    await expect(reviewDialog(page).getByRole('alert')).toContainText('novo total 27.046 ETH');
    await reviewDialog(page)
      .getByRole('button', { name: 'Confirmar novos valores e pagar' })
      .click();

    await expectReceipt(page);
    await expect(page.getByText('2.58 ETH')).toBeVisible();
  });

  test('sends the user back to the cart when an edition sells out during the purchase', async ({
    page,
  }) => {
    await openCheckout(page, 'sold-out-at-checkout');
    await reviewAndConnect(page);
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(reviewDialog(page).getByRole('alert')).toContainText('esgotou');
    await reviewDialog(page).getByRole('link', { name: 'Revisar carrinho' }).click();
    await expect(page.getByText('Esta edição esgotou.')).toBeVisible();
  });

  test('shows a declined payment and keeps the cart items', async ({ page }) => {
    await openCheckout(page, 'payment-declined');
    await reviewAndConnect(page);
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(
      reviewDialog(page).getByRole('heading', { name: 'Pagamento recusado' }),
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/checkout$/);
    await reviewDialog(page).getByRole('link', { name: 'Voltar ao carrinho' }).click();
    await expect(page.getByRole('button', { name: /^Remover .+ do carrinho$/ })).toHaveCount(3);
  });

  test('creates a single order on repeated clicks', async ({ page }) => {
    await openCheckout(page);
    await reviewAndConnect(page);
    const orderIds = new Set<string>();
    page.on('response', (response) => {
      if (isOrderPost(response)) {
        void response.json().then((body: { id?: string }) => body.id && orderIds.add(body.id));
      }
    });

    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).dblclick();
    await expectReceipt(page);
    expect(orderIds.size).toBe(1);
  });

  test('recovers the same order after a timeout using the idempotency key', async ({ page }) => {
    await openCheckout(page, 'order-timeout');
    await reviewAndConnect(page);
    const idempotencyKeys: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders') {
        idempotencyKeys.push(request.headers()['idempotency-key'] ?? '');
      }
    });

    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expect(reviewDialog(page).getByText(/sem criar outra compra/)).toBeVisible({
      timeout: 10_000,
    });
    await expectReceipt(page);

    expect(idempotencyKeys.length).toBeGreaterThanOrEqual(2);
    expect(new Set(idempotencyKeys).size).toBe(1);
  });

  test('resumes a pending order after a page refresh', async ({ page }) => {
    await openCheckout(page);
    await reviewAndConnect(page);
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expect(reviewDialog(page).getByText(/Pedido ord-.+ pendente/)).toBeVisible();

    await page.reload();
    await expect(reviewDialog(page).getByText(/Pedido ord-.+ pendente/)).toBeVisible();
    await expectReceipt(page);
  });

  test('handles wallet rejection, disconnection and reconnection', async ({ page }) => {
    await openCheckout(page, 'wallet-rejected');
    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }).click();
    await expect(reviewDialog(page).getByRole('alert')).toHaveText(
      'A conexão foi recusada na carteira.',
    );
    await expect(
      reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }),
    ).toBeDisabled();

    await page.evaluate(() => window.__kurioMocks?.setScenario('wallet-disconnects'));
    await reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }).click();
    await reviewDialog(page).getByRole('button', { name: 'Desconectar' }).click();
    await expect(
      reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }),
    ).toBeVisible();

    await reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }).click();
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expect(reviewDialog(page).getByRole('alert')).toHaveText(
      'A carteira foi desconectada. Conecte novamente para pagar.',
    );
    await reviewDialog(page).getByRole('button', { name: 'Conectar carteira' }).click();
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expectReceipt(page);
  });

  test('preserves the checkout when the session expires and resumes after login', async ({
    page,
  }) => {
    await openCheckout(page);
    await page
      .getByRole('textbox', { name: 'Observação do colecionador' })
      .fill('Presente de aniversário');
    await page.evaluate(() => window.__kurioMocks?.expireSessions());
    await page.getByRole('button', { name: 'Confirmar compra' }).click();

    await expect(page).toHaveURL(/\/login\?.*reason=expired/);
    await signIn(page, DEMO_USERS.nova);
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('textbox', { name: 'Observação do colecionador' })).toHaveValue(
      'Presente de aniversário',
    );
  });

  test('does not expose an order to another user', async ({ page }) => {
    await openCheckout(page);
    await reviewAndConnect(page);
    await reviewDialog(page).getByRole('button', { name: 'Confirmar e pagar' }).click();
    await expectReceipt(page);
    const orderUrl = new URL(page.url()).pathname;

    await page.evaluate(() => localStorage.removeItem('kurio.session.token'));
    await page.goto(`/login?redirect=${encodeURIComponent(orderUrl)}`);
    await signIn(page, DEMO_USERS.rafa);
    await expect(page.getByText('Pedido não encontrado')).toBeVisible();
  });
});
