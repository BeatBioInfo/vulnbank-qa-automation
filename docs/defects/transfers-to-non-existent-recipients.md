# Defect: Transfer to Non-Existent Recipient Debits Sender

**Defect ID:** VB-DEF-003  
**Severity:** High  
**Category:** Financial Integrity / Recipient Validation  
**Status:** Confirmed

## Description

The application processes a transfer to a non-existent recipient account. The sender's balance is deducted and a transaction record is created, even though the destination account does not exist.

## Steps to Reproduce

1. Log in with a valid account.
2. Navigate to Money Transfer.
3. Enter a recipient account number that does not exist, such as `0000000000000000000000`.
4. Enter a valid positive transfer amount.
5. Submit the transfer.
6. Verify the sender's balance and inspect the transactions table.

## Expected Result

The application rejects the transfer, leaves the sender's balance unchanged, and does not create a transaction record.

## Actual Result

The sender's balance is deducted, and the database records a transaction for the non-existent recipient.

## Database Evidence

| Field | Observed value |
|---|---|
| Transaction ID | 31 |
| Sender account | `3782453271` |
| Recipient account | `0000000000000000000000` |
| Amount | 10 |
| Transaction type | `transfer` |
| Description | Empty |

## Impact

Funds can be deducted from a valid sender without being credited to a valid recipient. This creates an inconsistent financial record and can result in loss of funds or reconciliation issues.

## Likely Technical Cause

The `/transfer` route in `app.py` updates the recipient balance but does not check whether the update affected any rows before inserting the transaction. The transfer logic should validate recipient existence and ensure the debit, credit, and transaction insert succeed together.

## Recommended Remediation

- Validate that the recipient account exists before processing the transfer.
- Check that the recipient update affects exactly one row.
- Ensure debit, credit, and transaction insertion are atomic.
- Reject invalid recipients without changing balances or recording a transaction.

## Evidence Source

Database transaction ID `31`, together with the observed sender balance deduction.

The application under test has not been modified.

## Automated Test Evidence

**Test file:** `tests/ui/transfers/transfer.spec.ts`

**Test case:** `user cannot transfer money to a non-existent recipient`

**Execution command:**
`npx playwright test tests/ui/transfers/transfer.spec.ts --grep "non-existent recipient" --workers=1`

**Observed results from the automated test:**
- HTTP status: `200`
- API status: `success`
- Sender balance: `1000` before, `990` after
- Matching transaction count: `1`
- Expected rejection and unchanged balance assertions failed.

**Evidence location:** The automated test code and its assertions are retained in the test file. The results above were recorded from the test run; they are not a raw terminal-output capture.