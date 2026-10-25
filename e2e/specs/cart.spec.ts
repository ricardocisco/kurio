import { expect, test, type Page } from '@playwright/test';

import { DEMO_USERS, openApp, signIn } from '../support/app';

const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' });
const summaryValue = (page: Page, label: string | RegExp) =>
  summary(page)
    .locator('div', { has: page.getByText(label, { exact: true }) })
    .locator('dd');
const cartLines = (page: Page, isMobile: boolean) =>
  isMobile
    ? page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
    : page
        .getByRole('table')
        .getByRole('row')
        .filter({ has: page.getByRole('button', { name: /^Remover/ }) });
const lineStepper = (page: Page, name: string) =>
  page.getByRole('group', { name: `Quantidade de ${name}` });

async function buyFromDetail(page: Page, path: string) {
  await page.goto(path);
  await page
    .getByRole('button', { name: /^Comprar( NFT)?$/ })
    .locator('visible=true')
    .click();
  await expect(page).toHaveURL(/\/cart$/);
}

test.describe('Cart', () => {
  test('adds as a guest, changes quantity, keeps it after refresh and removes', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/');
    await buyFromDetail(page, '/nfts/emerald-ape-0042');

    await expect(cartLines(page, isMobile)).toHaveCount(1);
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.19 ETH');
    await expect(summaryValue(page, 'Taxa de rede')).toContainText('0.012 ETH');

    await lineStepper(page, 'Emerald Ape #042')
      .getByRole('button', { name: 'Aumentar quantidade' })
      .click();
    await expect(lineStepper(page, 'Emerald Ape #042').locator('output')).toHaveText('2');
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH');
    await expect(summaryValue(page, 'Total')).toHaveText('2.392 ETH');

    await page.reload();
    await expect(lineStepper(page, 'Emerald Ape #042').locator('output')).toHaveText('2');

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click();
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
  });

  test('applies, rejects and removes coupons', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcart');
    await signIn(page, DEMO_USERS.nova);
    await expect(summaryValue(page, 'Total')).toHaveText('26.846 ETH');

    const coupon = page.getByRole('form', { name: 'Cupom de desconto' });
    const code = coupon.getByRole('textbox', { name: 'Código promocional' });
    const apply = coupon.getByRole('button', { name: 'Aplicar' });

    await code.fill('NAOEXISTE');
    await apply.click();
    await expect(code).toHaveAccessibleDescription(
      'Cupom inválido. Confira o código e tente novamente.',
    );

    await code.fill('verao25');
    await apply.click();
    await expect(code).toHaveAccessibleDescription('Este cupom expirou em 01/03/2025.');

    await code.fill('kurio10');
    await apply.click();
    await expect(summaryValue(page, 'Desconto (KURIO10)')).toHaveText('(-) 2.683 ETH');
    await expect(summaryValue(page, 'Total')).toHaveText('24.163 ETH');

    await page.reload();
    await expect(summaryValue(page, 'Total')).toHaveText('24.163 ETH');
    await page.getByRole('button', { name: 'Remover cupom' }).click();
    await expect(summaryValue(page, 'Total')).toHaveText('26.846 ETH');
  });

  test('keeps the guest items when the visitor signs in', async ({ page, isMobile }) => {
    await openApp(page, '/');
    await buyFromDetail(page, '/nfts/golden-beat-0207?edition=%22golden-beat-0207-open%22');
    await expect(cartLines(page, isMobile)).toHaveCount(1);

    await page.goto('/login?redirect=%2Fcart');
    await signIn(page, DEMO_USERS.nova);

    await expect(
      page.getByText(/Juntamos 1 item\(ns\) do seu carrinho de visitante/),
    ).toBeVisible();
    await expect(cartLines(page, isMobile)).toHaveCount(4);
    await expect(page.getByRole('link', { name: 'Golden Beat #207' })).toBeVisible();
  });

  test('flags price and stock changes and blocks checkout until they are resolved', async ({
    page,
  }) => {
    await openApp(page, '/login?redirect=%2Fcart');
    await signIn(page, DEMO_USERS.nova);
    await expect(summaryValue(page, 'Total')).toHaveText('26.846 ETH');

    await page.evaluate(() => {
      window.__kurioMocks?.setEditionPrice('emerald-ape-0042', 'emerald-ape-0042-1-50', '1.29');
      window.__kurioMocks?.setEditionAvailability('ivory-baron-0088', 'ivory-baron-0088-1-50', 4);
    });
    await page.reload();

    await expect(page.getByText('O preço mudou de 1.19 ETH para 1.29 ETH.')).toBeVisible();
    await expect(summaryValue(page, 'Subtotal')).toHaveText('27.03 ETH');
    await expect(page.getByText('Restam apenas 4 unidades desta edição.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled();

    await page.getByRole('button', { name: 'Ajustar quantidade' }).click();
    await expect(lineStepper(page, 'Ivory Baron #088').locator('output')).toHaveText('4');
    await page.getByRole('button', { name: 'Entendi' }).click();
    await expect(page.getByText('O preço mudou de 1.19 ETH para 1.29 ETH.')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible();
  });

  test('keeps carts isolated per user', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcart');
    await signIn(page, DEMO_USERS.rafa);
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
  });
});
