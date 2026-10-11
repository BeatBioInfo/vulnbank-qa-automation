import { Page, Locator } from '@playwright/test';

export class Navigation {
  readonly page: Page;
  readonly moneyTransferLink: Locator;


  constructor(page: Page) {
    this.page = page;

    this.moneyTransferLink = page.getByRole('link', {
      name: 'Money Transfer',
    });

  }

  async goToMoneyTransfer() {
    await this.moneyTransferLink.click();
  }
}