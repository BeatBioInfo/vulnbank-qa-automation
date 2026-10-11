import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function getUserBalance(accountNumber: string): Promise<number> {
  const result = await pool.query(
    `
    SELECT balance
    FROM users
    WHERE account_number = $1
    `,
    [accountNumber]
  );

  if (result.rows.length === 0) {
    throw new Error(`User not found: ${accountNumber}`);
  }

  return Number(result.rows[0].balance);
}

export async function getTransaction(
  senderAccount: string,
  recipientAccount: string,
  amount: number,
  description: string
) {
  const result = await pool.query(
    `
    SELECT
      id,
      from_account,
      to_account,
      amount,
      timestamp,
      transaction_type,
      description
    FROM transactions
    WHERE from_account = $1
      AND to_account = $2
      AND amount = $3
      AND description = $4
    ORDER BY id DESC
    LIMIT 1
    `,
    [senderAccount, recipientAccount, amount, description]
  );

  if (result.rows.length === 0) {
    throw new Error('Transaction not found');
  }

  return result.rows[0];
}

export async function getTransactionCountByDescription(
  description: string
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM transactions
     WHERE description = $1`,
    [description]
  );

  return result.rows[0].count;
}