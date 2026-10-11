import { test, expect } from '@playwright/test';

import { LoginPage } from '../../../pages/loginPage';
import { Navigation } from '../../../pages/navigation';
import { TransferPage } from '../../../pages/transferPage';
import { Disclaimer } from '../../../pages/disclaimer';
import { transferData, validUser, exactBalanceUser } from '../../../test-data/users';

import {
  getUserBalance,
  getTransaction,
  getTransactionCountByDescription,
} from '../../../database/postgresdb';

test('user can successfully transfer money', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  const uiBalanceBefore = Number(
    (await transferPage.balance.textContent())!.replace('$', '')
  );

  const dbBalanceBefore = await getUserBalance(
    validUser.accountNumber
  );

  const recipientBalanceBefore = await getUserBalance(
    transferData.recipientAccount
  );

  expect(uiBalanceBefore).toBe(dbBalanceBefore);

  await navigation.goToMoneyTransfer();

  await expect(transferPage.transferSection).toBeVisible();

  await transferPage.sendMoney(
    transferData.recipientAccount,
    transferData.amount,
    transferData.description
  );

  await expect(transferPage.transferSuccessToast).toBeVisible();

  const uiBalanceAfter = Number(
    (await transferPage.balance.textContent())!.replace('$', '')
  );

  const dbBalanceAfter = await getUserBalance(
    validUser.accountNumber
  );

  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );

  expect(uiBalanceAfter).toBe(
    uiBalanceBefore - transferData.amount
  );

  expect(uiBalanceAfter).toBe(dbBalanceAfter);

  expect(dbBalanceAfter).toBe(
    dbBalanceBefore - transferData.amount
  );

  expect(recipientBalanceAfter).toBe(
    recipientBalanceBefore + transferData.amount
  );

  const transaction = await getTransaction(
    validUser.accountNumber,
    transferData.recipientAccount,
    transferData.amount,
    transferData.description
  );

  expect(transaction.from_account).toBe(validUser.accountNumber);
  expect(transaction.to_account).toBe(transferData.recipientAccount);
  expect(Number(transaction.amount)).toBe(transferData.amount);
  expect(transaction.transaction_type).toBe('transfer');
  expect(transaction.description).toBe(transferData.description);
});

test('user cannot transfer money to their own account', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const description = `Self-transfer negative test ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  const balanceBefore = await getUserBalance(validUser.accountNumber);

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  await transferPage.sendMoney(
  validUser.accountNumber,
  10,
  description
);

// Observe the application's response.
const successToast = page.locator('#toast-container .toast.success');
await expect(successToast).toBeVisible();

// Capture database evidence before any assertion can stop the test.
const balanceAfter = await getUserBalance(validUser.accountNumber);
const transactionCount =
  await getTransactionCountByDescription(description);

console.log('Self-transfer evidence:', {
  description,
  balanceBefore,
  balanceAfter,
  transactionCount,
});

// Verify the expected rejection. This should fail if no error toast appears.
const errorToast = page.locator('#toast-container .toast.error');
await expect(errorToast).toBeVisible();

// These run only if the error-toast assertion passes.
expect(balanceAfter).toBe(balanceBefore);
expect(transactionCount).toBe(0);
});


test('user cannot transfer a negative amount', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const amount = -10;
  const description = `Negative transfer test ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

    const senderBalanceBefore = await getUserBalance(
      validUser.accountNumber
    );
    const recipientBalanceBefore = await getUserBalance(
      transferData.recipientAccount
    );

    await navigation.goToMoneyTransfer();
    await expect(transferPage.transferSection).toBeVisible();

    const transferResponsePromise = page.waitForResponse(
    response =>
      response.url().endsWith('/transfer') &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    transferData.recipientAccount,
    amount,
    description
  );

  const transferResponse = await transferResponsePromise;

  console.log('Transfer API evidence:', {
    status: transferResponse.status(),
    body: await transferResponse.text(),
  });

  // Capture the outcome before making assertions.
  const successToast = page.locator('#toast-container .toast.success');
  const errorToast = page.locator('#toast-container .toast.error');

  const successVisible = await successToast.isVisible();
  const errorVisible = await errorToast.isVisible();

  const senderBalanceAfter = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  console.log('Negative-transfer evidence:', {
    description,
    amount,
    successVisible,
    errorVisible,
    senderBalanceBefore,
    senderBalanceAfter,
    recipientBalanceBefore,
    recipientBalanceAfter,
    transactionCount,
  });

  // A negative transfer should be rejected.
  expect.soft(errorVisible).toBe(true);

  // Neither account should be affected.
  expect.soft(senderBalanceAfter).toBe(senderBalanceBefore);
  expect.soft(recipientBalanceAfter).toBe(recipientBalanceBefore);

  // A rejected transfer must not be recorded.
  expect.soft(transactionCount).toBe(0);

});


test('user cannot transfer more than their available balance', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const description = `Insufficient funds test ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  const senderBalanceBefore = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceBefore = await getUserBalance(
    transferData.recipientAccount
  );

  // Deliberately exceed the current balance.
  const amount = senderBalanceBefore + 1;

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  const transferResponsePromise = page.waitForResponse(
    response =>
      response.url().endsWith('/transfer') &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    transferData.recipientAccount,
    amount,
    description
  );

  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();

  // Wait for the UI's rejection message.
  const errorToast = page.locator('#toast-container .toast.error');
  await expect(errorToast).toBeVisible();

  // Verify persisted state after the API response.
  const senderBalanceAfter = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  // console.log('Insufficient-funds evidence:', {
  //   amount,
  //   senderBalanceBefore,
  //   senderBalanceAfter,
  //   recipientBalanceBefore,
  //   recipientBalanceAfter,
  //   responseStatus: transferResponse.status(),
  //   responseBody,
  //   transactionCount,
  // });

  expect(responseBody.status).toBe('error');
  expect(senderBalanceAfter).toBe(senderBalanceBefore);
  expect(recipientBalanceAfter).toBe(recipientBalanceBefore);
  expect(transactionCount).toBe(0);
});


test('user cannot transfer money to a non-existent recipient', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const invalidRecipient = '0000000000000000000000';
  const amount = 10;
  const description = `Invalid recipient test ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  const senderBalanceBefore = await getUserBalance(
    validUser.accountNumber
  );

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  const transferResponsePromise = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === '/transfer' &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    invalidRecipient,
    amount,
    description
  );

  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();

  // The API response arrives after the transfer handler completes.
  const senderBalanceAfter = await getUserBalance(
    validUser.accountNumber
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  // console.log('Invalid-recipient evidence:', {
  //   invalidRecipient,
  //   amount,
  //   description,
  //   httpStatus: transferResponse.status(),
  //   responseBody,
  //   senderBalanceBefore,
  //   senderBalanceAfter,
  //   transactionCount,
  // });

  // A transfer to a non-existent recipient should be rejected.
  expect.soft(responseBody.status).toBe('error');
  expect.soft(senderBalanceAfter).toBe(senderBalanceBefore);
  expect.soft(transactionCount).toBe(0);
});


test('user cannot transfer zero amount', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const amount = 0;
  const description = `Zero transfer test ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  const senderBalanceBefore = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceBefore = await getUserBalance(
    transferData.recipientAccount
  );

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  const transferResponsePromise = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === '/transfer' &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    transferData.recipientAccount,
    amount,
    description
  );

  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();

  const senderBalanceAfter = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  console.log('Zero-value transfer evidence:', {
    amount,
    description,
    httpStatus: transferResponse.status(),
    responseBody,
    senderBalanceBefore,
    senderBalanceAfter,
    recipientBalanceBefore,
    recipientBalanceAfter,
    transactionCount,
  });

  // A zero-value transfer should be rejected.
  expect.soft(responseBody.status).toBe('error');
  expect.soft(senderBalanceAfter).toBe(senderBalanceBefore);
  expect.soft(recipientBalanceAfter).toBe(recipientBalanceBefore);
  expect.soft(transactionCount).toBe(0);
});


test('user can transfer a minimum positive amount of 0.01', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const amount = 0.01;
  const description = `Minimum positive transfer ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await disclaimer.acknowledge();

  const senderBalanceBefore = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceBefore = await getUserBalance(
    transferData.recipientAccount
  );

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  const transferResponsePromise = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === '/transfer' &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    transferData.recipientAccount,
    amount,
    description
  );

  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();

  const senderBalanceAfter = await getUserBalance(
    validUser.accountNumber
  );
  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  console.log('Minimum positive transfer evidence:', {
    amount,
    httpStatus: transferResponse.status(),
    responseBody,
    senderBalanceBefore,
    senderBalanceAfter,
    recipientBalanceBefore,
    recipientBalanceAfter,
    transactionCount,
  });

  expect(transferResponse.status()).toBe(200);
  expect(responseBody.status).toBe('success');
  expect(senderBalanceAfter).toBeCloseTo(senderBalanceBefore - amount, 2);
  expect(recipientBalanceAfter).toBeCloseTo(
    recipientBalanceBefore + amount,
    2
  );
  expect(transactionCount).toBe(1);
});


test('user can transfer their exact available balance', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const description = `Exact balance transfer ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(
    exactBalanceUser.username,
    exactBalanceUser.password
  );
  await disclaimer.acknowledge();

  const senderBalanceBefore = await getUserBalance(
    exactBalanceUser.accountNumber
  );
  const recipientBalanceBefore = await getUserBalance(
    transferData.recipientAccount
  );

  expect(senderBalanceBefore).toBeGreaterThan(0);
  expect(exactBalanceUser.accountNumber).not.toBe(
    transferData.recipientAccount
  );

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  const transferResponsePromise = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === '/transfer' &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    transferData.recipientAccount,
    senderBalanceBefore,
    description
  );

  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();

  const senderBalanceAfter = await getUserBalance(
    exactBalanceUser.accountNumber
  );
  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  console.log('Exact-balance transfer evidence:', {
    amount: senderBalanceBefore,
    httpStatus: transferResponse.status(),
    responseBody,
    senderBalanceBefore,
    senderBalanceAfter,
    recipientBalanceBefore,
    recipientBalanceAfter,
    transactionCount,
  });

  expect(transferResponse.status()).toBe(200);
  expect(responseBody.status).toBe('success');
  expect(senderBalanceAfter).toBe(0);
  expect(recipientBalanceAfter).toBeCloseTo(
    recipientBalanceBefore + senderBalanceBefore,
    2
  );
  expect(transactionCount).toBe(1);
});


test('user can transfer their balance while retaining 0.01', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navigation = new Navigation(page);
  const transferPage = new TransferPage(page);
  const disclaimer = new Disclaimer(page);

  const description = `Retain one cent transfer ${Date.now()}`;

  await loginPage.goto();
  await loginPage.login(
    exactBalanceUser.username,
    exactBalanceUser.password
  );
  await disclaimer.acknowledge();

  const senderBalanceBefore = await getUserBalance(
    exactBalanceUser.accountNumber
  );
  const recipientBalanceBefore = await getUserBalance(
    transferData.recipientAccount
  );

  expect(senderBalanceBefore).toBeGreaterThan(0.01);
  expect(exactBalanceUser.accountNumber).not.toBe(transferData.recipientAccount);

  const amount = Number((senderBalanceBefore - 0.01).toFixed(2));

  await navigation.goToMoneyTransfer();
  await expect(transferPage.transferSection).toBeVisible();

  const transferResponsePromise = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === '/transfer' &&
      response.request().method() === 'POST'
  );

  await transferPage.sendMoney(
    transferData.recipientAccount,
    amount,
    description
  );

  const transferResponse = await transferResponsePromise;
  const responseBody = await transferResponse.json();

 const senderBalanceAfter = await getUserBalance(
  exactBalanceUser.accountNumber
);
  const recipientBalanceAfter = await getUserBalance(
    transferData.recipientAccount
  );
  const transactionCount = await getTransactionCountByDescription(
    description
  );

  console.log('Retain-one-cent transfer evidence:', {
    amount,
    httpStatus: transferResponse.status(),
    responseBody,
    senderBalanceBefore,
    senderBalanceAfter,
    recipientBalanceBefore,
    recipientBalanceAfter,
    transactionCount,
  });

  expect(transferResponse.status()).toBe(200);
  expect(responseBody.status).toBe('success');
  expect(senderBalanceAfter).toBe(0.01);
  expect(recipientBalanceAfter).toBeCloseTo(
    recipientBalanceBefore + amount,
    2
  );
  expect(transactionCount).toBe(1);
});






