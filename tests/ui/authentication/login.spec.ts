import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/loginPage';

test('user can sign in with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('woziqewe', 'Pa$$w0rd!');

  await expect(page).not.toHaveURL(/login/);
  await expect(
    page.getByText('Welcome back, woziqewe')
  ).toBeVisible();
});