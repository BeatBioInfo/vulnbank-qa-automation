
import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { LoginPage } from '../pages/loginPage';
import { Disclaimer } from '../pages/disclaimer';
import { validUser } from '../test-data/users';

const authFile = path.resolve(
  __dirname,
  '../playwright/.auth/user.json'
);

setup('authenticate once', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const disclaimer = new Disclaimer(page);

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  await expect(
    page.getByText(`Welcome back, ${validUser.username}`)
  ).toBeVisible();

  await mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
