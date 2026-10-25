import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { DEMO_USERS, openApp, signIn, signOut } from '../support/app';

const AVATAR_FIXTURE = path.join(import.meta.dirname, '..', 'fixtures', 'avatar.png');

async function openAccount(
  page: Page,
  path: string,
  user: { email: string; password: string } = DEMO_USERS.nova,
) {
  await openApp(page, `/login?redirect=${encodeURIComponent(path)}`);
  await signIn(page, user);
  await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')));
}

const profileForm = (page: Page) => page.getByRole('form', { name: 'Perfil do colecionador' });
const passwordForm = (page: Page) => page.getByRole('form', { name: 'Alterar senha' });

test.describe('Account profile', () => {
  test('edits the profile and keeps it after refresh', async ({ page, isMobile }) => {
    await openAccount(page, '/account/profile');
    const displayName = profileForm(page).getByRole('textbox', { name: 'Nome de exibição' });
    await displayName.fill('Nova Sato Studio');
    await profileForm(page).getByRole('textbox', { name: 'Nome ENS' }).fill('novastudio');
    await profileForm(page).getByRole('button', { name: 'Salvar dados' }).click();
    await expect(page.getByText('Dados do perfil salvos.').first()).toBeVisible();

    await expect(page.getByText('Conectado como Nova Sato Studio')).toBeVisible();
    if (!isMobile) {
      await expect(
        page.getByRole('button', { name: 'Menu da conta de Nova Sato Studio' }),
      ).toBeVisible();
    }
    await page.reload();
    await expect(displayName).toHaveValue('Nova Sato Studio');
    await expect(profileForm(page).getByRole('textbox', { name: 'Nome ENS' })).toHaveValue(
      'novastudio',
    );
  });

  test('shows client and API validation errors', async ({ page }) => {
    await openAccount(page, '/account/profile');
    const email = profileForm(page).getByRole('textbox', { name: 'E-mail' });
    await email.fill('email-invalido');
    await profileForm(page).getByRole('button', { name: 'Salvar dados' }).click();
    await expect(email).toHaveAccessibleDescription('Informe um e-mail válido.');

    await email.fill(DEMO_USERS.nova.email);
    const username = profileForm(page).getByRole('textbox', { name: 'Nome de usuário' });
    await username.fill('rafa.lima');
    await profileForm(page).getByRole('button', { name: 'Salvar dados' }).click();
    await expect(username).toHaveAccessibleDescription('Este nome de usuário já está em uso.');
    await expect(username).toBeFocused();
  });

  test('uploads, keeps and removes the avatar', async ({ page }) => {
    await openAccount(page, '/account/profile');
    const fileInput = page.getByLabel('Avatar', { exact: true });

    await fileInput.setInputFiles({
      name: 'notas.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('oi'),
    });
    await expect(
      page.getByRole('alert').filter({ hasText: 'Envie uma imagem PNG, JPG ou WebP.' }),
    ).toBeVisible();

    await fileInput.setInputFiles(AVATAR_FIXTURE);
    const avatar = page.getByRole('img', { name: 'Avatar de Nova Sato' });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('src', /^data:image\/webp;base64,/);

    await page.reload();
    await expect(avatar).toBeVisible();
    await page.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(avatar).toHaveCount(0);
  });

  test('changes the password with validation and signs in with the new one', async ({
    page,
    isMobile,
  }) => {
    await openAccount(page, '/account/profile');
    const form = passwordForm(page);
    const fill = async (current: string, next: string, confirm: string) => {
      await form.getByLabel(/^Senha atual/).fill(current);
      await form.getByLabel(/^Nova senha/).fill(next);
      await form.getByLabel(/^Confirmar nova senha/).fill(confirm);
      await form.getByRole('button', { name: 'Alterar senha' }).click();
    };

    await fill(DEMO_USERS.nova.password, 'NovaSenha1', 'Diferente1');
    await expect(form.getByText('As senhas não conferem.')).toBeVisible();

    await fill('Errada123', 'NovaSenha1', 'NovaSenha1');
    await expect(form.getByLabel(/^Senha atual/)).toHaveAccessibleDescription(
      'Senha atual incorreta.',
    );

    await fill(DEMO_USERS.nova.password, 'NovaSenha1', 'NovaSenha1');
    await expect(
      page.getByText('Senha alterada. Use a nova senha no próximo login.'),
    ).toBeVisible();

    await signOut(page, isMobile);
    await page.goto('/login');
    await signIn(page, DEMO_USERS.nova, { expectSuccess: false });
    await expect(
      page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' }),
    ).toBeVisible();
    await signIn(page, { email: DEMO_USERS.nova.email, password: 'NovaSenha1' });
  });
});

test.describe('Account wallets', () => {
  const primaryForm = (page: Page) => page.getByRole('form', { name: 'Carteira principal' });

  test('edits the primary wallet with validation and uses it in checkout', async ({ page }) => {
    await openAccount(page, '/account/wallets');
    const address = primaryForm(page).getByRole('textbox', { name: 'Endereço da carteira' });
    await address.fill('0x123');
    await primaryForm(page).getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(address).toHaveAccessibleDescription(
      'Informe um endereço 0x válido (42 caracteres).',
    );

    await address.fill('0xA91F3c5D7e8B9a0F1c2D3e4F5a6B7c8D9e0FE82C');
    await primaryForm(page).getByRole('textbox', { name: 'Apelido da carteira' }).fill('Cofre');
    await primaryForm(page).getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(page.getByText('Carteira principal salva.').first()).toBeVisible();

    await page.reload();
    await expect(
      primaryForm(page).getByRole('textbox', { name: 'Apelido da carteira' }),
    ).toHaveValue('Cofre');
    await page.goto('/checkout');
    await expect(page.getByText('Cofre', { exact: true })).toBeVisible();
  });

  test('removes, copies and edits the secondary wallet', async ({ page }) => {
    await openAccount(page, '/account/wallets');
    await page.getByRole('button', { name: 'Remover carteira secundária' }).click();
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).check();
    await page.getByRole('button', { name: 'Adicionar' }).click();
    await expect(page.getByText('Principal (cópia)')).toBeVisible();

    await page.getByRole('button', { name: 'Editar carteira secundária' }).click();
    const secondary = page.getByRole('form', { name: 'Carteira secundária' });
    await secondary.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Viagem');
    await secondary.getByRole('combobox', { name: 'Rede' }).selectOption('polygon');
    await secondary
      .getByRole('textbox', { name: 'Endereço da carteira' })
      .fill('0x5B2e8C1d9F7a3E6b4D0c2A8f1E9d7C5b3A1f0D2E');
    await secondary.getByRole('button', { name: 'Salvar carteira secundária' }).click();

    await expect(page.getByText('Viagem', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Viagem', { exact: true })).toBeVisible();
    await expect(page.getByText(/Rede Polygon/)).toBeVisible();
  });

  test('requires a primary wallet before the secondary one', async ({ page }) => {
    await openAccount(page, '/account/wallets', DEMO_USERS.rafa);
    await expect(page.getByText('Cadastre a carteira principal primeiro.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adicionar' })).toBeDisabled();

    await primaryForm(page).getByRole('textbox', { name: 'Apelido da carteira' }).fill('Ateliê');
    await primaryForm(page)
      .getByRole('textbox', { name: 'Endereço da carteira' })
      .fill('0x9C1d2E3f4A5b6C7d8E9f0A1b2C3d4E5f6A7b8C9d');
    await primaryForm(page).getByRole('button', { name: 'Salvar carteira' }).click();
    await expect(page.getByRole('button', { name: 'Adicionar' })).toBeEnabled();
  });
});
