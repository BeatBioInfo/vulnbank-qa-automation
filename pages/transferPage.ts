import { Page, Locator } from '@playwright/test';

export class TransferPage {
  readonly page: Page;
  readonly transferSection: Locator;
  readonly recipientAccountInput: Locator;
  readonly amountInput: Locator;
  readonly descriptionInput: Locator;
  readonly sendMoneyButton: Locator;
  readonly transferSuccessToast: Locator;
  readonly balance: Locator;


  constructor(page: Page) {
  this.page = page;

  this.transferSection = page.locator('#transfers');

  this.recipientAccountInput = this.transferSection.getByLabel(
    'Recipient Account Number'
  );

  this.amountInput = this.transferSection.getByLabel('Amount');

  this.descriptionInput = this.transferSection.getByLabel(
    'Description (optional)'
  );

  this.sendMoneyButton = this.transferSection.getByRole('button', {
    name: 'Send Money',
  });

  this.transferSuccessToast = page.getByText(
    'Transfer Successful',
    { exact: true }
  );

  this.balance = page.locator('#balance');

}

  async sendMoney(
    recipientAccount: string,
    amount: number,
    description?: string
  ) {
    await this.recipientAccountInput.fill(recipientAccount);
    await this.amountInput.fill(amount.toString());

    if (description) {
      await this.descriptionInput.fill(description);
    }

    await this.sendMoneyButton.click();
  }
}