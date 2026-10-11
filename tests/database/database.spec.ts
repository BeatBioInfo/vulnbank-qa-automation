import { test, expect } from '@playwright/test';
import { getUserBalance, getTransaction, getTransactionCountByDescription, } from '../../database/postgresdb';

test('can read user balance from database', async () => {
  const balance = await getUserBalance('3349012346');

  expect(balance).toBe(900);
});

