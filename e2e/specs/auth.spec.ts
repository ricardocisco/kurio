import { expect, test } from '@playwright/test';

import { authForm, DEMO_USERS, expectSignedInAs, openApp, signIn, signOut } from '../support/app';

test.describe('Authentication', () => {
  test('registers a new account and keeps the session after refresh', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/register');
    const form = authForm(page, 'Criar conta');

    await form.getByRole('textbox', { name: 'Nome de usuário' }).fill('nova.colecionadora');
    await form.getByRole('textbox', { name: 'E-mail' }).fill('nova.colecionadora@kurio.dev');
    await form.getByLabel('Senha', { exact: true }).fill('Segura123');
    await form.getByLabel('Confirmar senha', { exact: true }).fill('Segura123');
    await form.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.getByText('Bem-vindo, nova.colecionadora!')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await page.reload();
    await expectSignedInAs(page, 'nova.colecionadora', isMobile);
  });

  test('validates the registration form on the client', async ({ page }) => {
    await openApp(page, '/register');
    const form = authForm(page, 'Criar conta');

    await form.getByRole('button', { name: 'Criar conta' }).click();
    const username = form.getByRole('textbox', { name: 'Nome de usuário' });
    await expect(username).toBeFocused();
    await expect(username).toHaveAttribute('aria-invalid', 'true');
    await expect(username).toHaveAccessibleDescription('Use pelo menos 3 caracteres.');

    await form.getByLabel('Senha', { exact: true }).fill('curta');
    await form.getByLabel('Confirmar senha', { exact: true }).fill('outra');
    await form.getByRole('button', { name: 'Criar conta' }).click();
    await expect(form.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeVisible();
    await expect(form.getByText('As senhas não conferem.')).toBeVisible();
  });

  test('shows API conflicts and server-side validation errors on the fields', async ({ page }) => {
    await openApp(page, '/register');
    const form = authForm(page, 'Criar conta');
    const fill = async (username: string, email: string) => {
      await form.getByRole('textbox', { name: 'Nome de usuário' }).fill(username);
      await form.getByRole('textbox', { name: 'E-mail' }).fill(email);
      await form.getByLabel('Senha', { exact: true }).fill('Segura123');
      await form.getByLabel('Confirmar senha', { exact: true }).fill('Segura123');
      await form.getByRole('button', { name: 'Criar conta' }).click();
    };

    await fill('outro.nome', DEMO_USERS.nova.email);
    const email = form.getByRole('textbox', { name: 'E-mail' });
    await expect(email).toHaveAccessibleDescription(
      'Este e-mail já possui uma conta. Entre ou use outro e-mail.',
    );
    await expect(email).toBeFocused();

    await fill('admin', 'novo@kurio.dev');
    await expect(
      form.getByRole('textbox', { name: 'Nome de usuário' }),
    ).toHaveAccessibleDescription('Este nome de usuário é reservado. Escolha outro.');
  });

  test('rejects invalid credentials and returns to the protected page after login', async ({
    page,
  }) => {
    await openApp(page, '/account/profile');
    await expect(page).toHaveURL(/\/login\?redirect=/);

    await signIn(
      page,
      { email: DEMO_USERS.nova.email, password: 'senha-errada1' },
      { expectSuccess: false },
    );
    await expect(
      page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' }),
    ).toBeVisible();

    await signIn(page, DEMO_USERS.nova);
    await expect(page).toHaveURL(/\/account\/profile(\?|$)/);
    await expect(page.getByText(`Conectado como ${DEMO_USERS.nova.displayName}`)).toBeVisible();
  });

  test('handles session expiration during navigation and resumes the flow', async ({ page }) => {
    await openApp(page, '/login');
    await signIn(page, DEMO_USERS.nova);
    await expect(page.getByText('Bem-vindo, Nova Sato!')).toBeVisible();

    await page.evaluate(() => window.__kurioMocks?.expireSessions());
    await page.reload();
    await page.goto('/account/wallets');

    await expect(page).toHaveURL(/\/login\?/);
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible();
    await signIn(page, DEMO_USERS.nova);
    await expect(page).toHaveURL(/\/account\/wallets(\?|$)/);
  });

  test('logs out and switches users without leaking the previous session', async ({
    page,
    isMobile,
  }) => {
    await openApp(page, '/login');
    await signIn(page, DEMO_USERS.nova);
    await expectSignedInAs(page, DEMO_USERS.nova.displayName, isMobile);

    await signOut(page, isMobile);
    await page.goto('/account/profile');
    await expect(page).toHaveURL(/\/login\?redirect=/);

    await signIn(page, DEMO_USERS.rafa);
    await expect(page.getByText(`Conectado como ${DEMO_USERS.rafa.displayName}`)).toBeVisible();
    await expect(page.getByText(DEMO_USERS.nova.displayName)).toHaveCount(0);
  });

  test('redirects an authenticated user away from the login page', async ({ page }) => {
    await openApp(page, '/login');
    await signIn(page, DEMO_USERS.nova);
    await expect(page.getByText('Bem-vindo, Nova Sato!')).toBeVisible();

    await page.goto('/login?redirect=%2Fmarketplace');
    await expect(page).toHaveURL(/\/marketplace$/);
  });

  test('keeps keyboard focus inside the login dialog and closes it with Escape', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The login is a full page on mobile, without a dialog.');
    await openApp(page, '/login');
    const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' });
    await expect(dialog).toBeVisible();

    for (let step = 0; step < 15; step += 1) {
      await page.keyboard.press('Tab');
      await expect(dialog.locator(':focus')).toHaveCount(1);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });
});
