# Defect: Vuln Bank accepts transfers to the sender's own account

**Area:** Money Transfer  
**Type:** Business Logic  
**Severity:** To be assessed

## Preconditions
- User is logged in.
- User has a valid account with sufficient balance.

## Steps to reproduce
1. Navigate to Money Transfer.
2. Enter the logged-in user's own account number as the recipient.
3. Enter a valid amount, such as 10.
4. Submit the transfer.

## Expected result
The application rejects the self-transfer, displays a clear validation message, leaves the balance unchanged, and does not create a successful transaction record.

## Actual result
The application displays a success notification, deducts the amount from the sender's balance, and records a transaction where the sender and recipient account numbers are identical.

## Evidence
- Playwright test: `tests/ui/transfers/transfer.spec.ts`
- Database transaction: inspect the record using the unique test description.
- Playwright snapshot shows `Transfer Successful` and `Transfer Completed`.

## Status
Open, pending further investigation.