import { Page, Locator } from '@playwright/test';

export class Disclaimer {
  readonly disclaimer: Locator;
  readonly acknowledgeButton: Locator;

  constructor(page: Page) {
    this.disclaimer = page.locator('#vuln-disclaimer');

    this.acknowledgeButton = this.disclaimer.getByRole('button', {
      name: 'Got it',
    });
  }

  async acknowledge() {
    await this.acknowledgeButton.click();
    await this.disclaimer.waitFor({ state: 'hidden' });
  }
}