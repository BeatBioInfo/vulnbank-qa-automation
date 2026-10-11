# VB-DEF-004: Zero-Value Transfer Accepted

**Severity:** Medium, provisional  
**Category:** Financial Integrity / Input Validation  
**Status:** Confirmed

## Description

The application accepts a transfer amount of zero, displays a success notification, and records the transaction in the database despite no funds being transferred.

## Steps to Reproduce

1. Log in with a valid account.
2. Navigate to Money Transfer.
3. Enter a valid recipient account number.
4. Enter `0` as the transfer amount.
5. Submit the transfer.
6. Verify the UI response, account balances, and transaction records.

## Expected Result

The application rejects the zero-value transfer, leaves both account balances unchanged, and does not create a transaction record.

## Actual Result

The application reports a successful transfer and persists a transaction with an amount of zero. Neither account balance changes.

## Database Evidence

| Field | Observed value |
|---|---|
| Transaction ID | `34` |
| Sender account | `3782453271` |
| Recipient account | `6323772920` |
| Amount | `0` |
| Transaction type | `transfer` |
| Description | Empty |

## Automated Test Evidence

**Test file:** `tests/ui/transfers/transfer.spec.ts`  
**Test case:** `user cannot transfer zero amount`

Observed results from the automated run:

- HTTP status: `200`
- API status: `success`
- Sender balance: `990` before and after
- Recipient balance: `1000` before and after
- Matching transaction count: `1`

The test failed the assertions expecting an error response and no transaction record. The balance assertions passed.

## Impact

Zero-value transactions can clutter transaction history and complicate financial reporting and reconciliation. The observed zero-value transfer did not move funds.

## Likely Technical Cause

The `/transfer` route in `app.py` does not explicitly reject zero amounts before processing the transaction.

## Recommended Remediation

- Reject transfer amounts less than or equal to zero.
- Validate the amount on the server before processing the transfer.
- Add regression coverage to verify invalid amounts are rejected without creating transactions or changing balances.

## Evidence Source

Manual database transaction ID `34` and the automated Playwright test output. The application under test has not been modified.