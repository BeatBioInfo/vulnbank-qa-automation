# Vuln Bank QA Automation

Automated testing of banking workflows using Playwright, TypeScript, and PostgreSQL. This project focuses on validating financial transactions through UI automation and database-level verification, with particular attention to transaction integrity and edge cases.

## Project Overview

This project uses the [Vuln Bank](https://github.com/Commando-X/vuln-bank) application as a system under test (SUT). The objective is to evaluate how banking workflows behave under valid and invalid inputs, verify financial invariants, and identify discrepancies between expected and actual application behaviour.

The application is tested as-is. Application defects are documented through test evidence rather than corrected in the system under test.

## Technology Stack

- **Playwright:** Browser automation and UI assertions
- **TypeScript:** Test implementation
- **PostgreSQL:** Database-level validation of account balances and transactions
- **Node.js and npm:** Runtime and dependency management
- **GitHub Actions:** Initial CI workflow configuration

## Current Test Coverage

### Fund Transfers

| Scenario | Current status |
|---|---|
| Successful transfer | Automated and verified |
| Minimum positive amount (0.01) | Automated and passed |
| Transfer of the exact available balance | Automated and passed |
| Transfer leaving a balance of 0.01 | Transfer executed; test assertion requires correction |
| Insufficient funds | Automated test implemented; execution status to be confirmed |
| Transfer to the same account | Negative test exposes an application defect |
| Negative transfer amount | Negative test exposes an application defect |
| Zero-value transfer | Negative test exposes an application defect |
| Transfer to a non-existent recipient | Negative test exposes an application defect |
| Amounts with more than two decimal places | Manual observation; automation pending |

The test suite is a work in progress. Some negative tests are designed to expose existing application defects and therefore may fail when the application accepts an invalid transaction.

## Validation Approach

Tests combine UI behaviour with database assertions to provide stronger evidence than UI checks alone.

Depending on the scenario, validation includes:

- HTTP response status and response body
- Sender and recipient balances before and after a transfer
- Transaction record creation and transaction counts
- Error or success notifications displayed by the application
- Financial invariants, including whether rejected transactions leave balances unchanged

## Project Structure

- `pages/` - Page objects and UI interactions
- `tests/` - Automated test scenarios
- `test-data/` - Test users and transfer data
- `database/` - Database access and verification helpers
- `utils/` - Supporting utilities
- `docs/` - QA observations and supporting documentation
- `.github/workflows/` - GitHub Actions workflow
- `playwright.config.ts` - Playwright configuration

## Local Setup

### Prerequisites

- Node.js and npm
- Access to a running Vuln Bank application
- PostgreSQL configured with the application's database
- Valid test accounts and credentials

### Installation

Clone this repository and install its dependencies:

```bash
npm ci
npx playwright install
```

Create a local `.env` file using `.env.example` as a template. Populate the required application credentials, account numbers, and database connection settings for your local environment.

Do not commit `.env` or real credentials to version control.

### Running Tests

Run the transfer test file:

```bash
npx playwright test tests/ui/transfers/transfer.spec.ts --workers=1
```

The tests use shared, stateful account balances. Run scenarios individually when necessary, and ensure the relevant test accounts are in the expected starting state before executing state-changing tests.

## CI Status and Limitations

A GitHub Actions workflow is configured to install dependencies, install Playwright browsers, run tests, and upload the Playwright report.

The workflow is not yet fully configured to provision the Vuln Bank application, PostgreSQL database, and required test data. CI execution and reliability therefore remain work in progress.

## Current Focus

The current development focus is transfer edge-case coverage, stronger financial invariant assertions, reliable test data management, and repeatable execution of state-changing scenarios.
