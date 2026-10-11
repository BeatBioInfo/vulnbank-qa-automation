# Defect: Negative Transfer Amount Accepted

**Defect ID:** VB-DEF-002  
**Title:** Transfer endpoint accepts negative amounts and reverses the intended movement of funds  
**Severity:** High  
**Category:** Financial Integrity / Input Validation  
**Status:** Confirmed

## Description

The transfer endpoint accepts a negative transfer amount, processes it as a successful transaction, and persists the transaction in the database. Instead of rejecting the invalid amount, the application increases the sender's balance and decreases the recipient's balance.

## Preconditions

- User is authenticated.
- Sender and recipient accounts exist.
- Sender has sufficient funds to satisfy the application's balance check.

## Steps to Reproduce

1. Log in as `autotestoneuser`.
2. Navigate to Money Transfer.
3. Enter recipient account number `7316079281`.
4. Enter `-10` as the transfer amount.
5. Provide a unique transaction description.
6. Submit the transfer.
7. Inspect the API response, account balances, and transaction record in the database.

## Expected Result

The application rejects the negative amount, displays an appropriate validation error, leaves both account balances unchanged, and creates no transaction record.

## Actual Result

The application accepts the request and returns HTTP `200` with the response status `success` and message `Transfer Completed`.

Observed database evidence:

| Check | Before | After |
|---|---:|---:|
| Sender balance | $990 | $1,000 |
| Recipient balance | $1,010 | $1,000 |
| Transaction count for test description | 0 | 1 |

The transaction is persisted with an amount of `-10`.

## Evidence

- **API response:** HTTP `200`; `"status": "success"`; `"message": "Transfer Completed"`.
- **UI:** Success notification displayed; no error notification displayed.
- **Database:** Negative amount persisted as a transfer transaction.
- **Automated test:** `tests/ui/transfers/transfer.spec.ts`, test case `user cannot transfer a negative amount`.

## Impact

An attacker may submit a negative transfer amount to manipulate account balances. In the observed case, the sender gained $10 while the recipient lost $10. This violates expected financial transaction integrity.

## Recommended Remediation

- Reject transfer amounts less than or equal to zero on the server.
- Validate the amount before executing any balance updates or inserting a transaction.
- Return an appropriate client error for invalid input.
- Add server-side tests confirming that invalid amounts cannot change balances or create transactions.

## Notes

This finding documents observed behaviour in the intentionally vulnerable test application. No remediation was applied to the application under test.
