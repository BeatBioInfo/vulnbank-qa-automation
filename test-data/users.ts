export const validUser = {
  username: process.env.TEST_USERNAME!,
  password: process.env.TEST_PASSWORD!,
  accountNumber: process.env.TEST_ACCOUNT_NUMBER!,
};

export const transferData = {
  recipientAccount: process.env.TEST_RECIPIENT_ACCOUNT!,
  amount: 10,
  description: `Playwright transfer ${Date.now()}`,
};


export const exactBalanceUser = {
  username: process.env.EXACT_BALANCE_TEST_USERNAME!,
  password: process.env.EXACT_BALANCE_TEST_PASSWORD!,
  accountNumber: process.env.EXACT_BALANCE_TEST_ACCOUNT_NUMBER!,
};

