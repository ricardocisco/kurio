import { expect, test, type Page } from '@playwright/test';

import { DEMO_USERS, openApp, signIn } from '../support/app';

async function focusedElementHasVisibleOutline(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return false;
    const style = getComputedStyle(element);
    const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    const hasRing = style.boxShadow !== 'none';
    return hasOutline || hasRing;
  });
}

async function tabUntil(page: Page, predicate: () => Promise<boolean>, maxSteps = 40) {
  for (let step = 0; step < maxSteps; step += 1) {
    await page.keyboard.press('Tab');
    if (await predicate()) return;
  }
  throw new Error('Target was not reached with the keyboard');
}

test.describe('Keyboard and focus', () => {
  test('skips to the main content and shows a visible focus ring', async ({ page }) => {
    await openApp(page, '/', 'instant');
    await expect(page.getByText('Todos os NFTs').locator('visible=true').first()).toBeVisible();
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();

    await page.keyboard.press('Tab');
    expect(await focusedElementHasVisibleOutline(page)).toBe(true);
  });

  test('filters the catalog using only the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop sidebar filters');
    await openApp(page, '/', 'instant');
    const filter = page
      .getByRole('complementary', { name: 'Filtros do catálogo' })
      .getByRole('button', { name: /^Música/ });
    await tabUntil(page, () => filter.evaluate((element) => element === document.activeElement));
    expect(await focusedElementHasVisibleOutline(page)).toBe(true);
    await page.keyboard.press('Space');
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/categories=.*music/);
  });

  test('traps focus in the checkout review and restores it on close', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fcheckout', 'instant');
    await signIn(page, DEMO_USERS.nova);
    const trigger = page.getByRole('button', { name: 'Confirmar compra' });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Revise seu pedido' })).toBeVisible();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const insideDialog = await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      );
      expect(insideDialog).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('opens and closes the account menu with the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Account menu lives in the desktop header');
    await openApp(page, '/login', 'instant');
    await signIn(page, DEMO_USERS.nova);
    const menuButton = page.getByRole('button', { name: /^Menu da conta de/ });
    await menuButton.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem').nth(1)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(menuButton).toBeFocused();
  });

  test('opens the mobile filters sheet and returns focus when closed', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile filters sheet');
    await openApp(page, '/', 'instant');
    const trigger = page
      .getByRole('button', { name: /filtros/i })
      .locator('visible=true')
      .first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

const REFLOW_PAGES = ['/', '/marketplace', '/nfts/emerald-ape-0042', '/login', '/register'];
const PRIVATE_REFLOW_PAGES = ['/cart', '/checkout', '/account/profile', '/account/wallets'];

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('Reflow and zoom', () => {
  test.use({ viewport: { width: 720, height: 450 } });

  test('has no horizontal scroll at 200% zoom of a 1440px screen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Covered once with the desktop profile');
    for (const path of REFLOW_PAGES) {
      await openApp(page, path, 'instant');
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page);
    }
    await openApp(page, '/login', 'instant');
    await signIn(page, DEMO_USERS.nova);
    for (const path of PRIVATE_REFLOW_PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe('Reflow at 320px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('keeps every page within 320 CSS pixels', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Covered once with the mobile profile');
    for (const path of REFLOW_PAGES) {
      await openApp(page, path, 'instant');
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page);
    }
    await openApp(page, '/login', 'instant');
    await signIn(page, DEMO_USERS.nova);
    for (const path of PRIVATE_REFLOW_PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page);
    }
  });
});
