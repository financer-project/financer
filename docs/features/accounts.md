# Accounts

An **Account** represents a financial account within a household - such as a checking account, savings account, credit card, or cash wallet.

## Purpose

Accounts serve as containers for transactions. Every transaction in Financer must be linked to an account, which allows you to:

- Track the balance of each account independently
- See transaction history per account
- Organize finances by where money is held
- Set a default account for quick transaction entry

## Account Properties

| Property | Description |
|----------|-------------|
| Name | Display name for the account (e.g., "Main Checking", "Savings") |
| Technical Identifier | Optional identifier such as an IBAN or account number, useful for matching during CSV imports |

## How Accounts Interact with Other Entities

- **Household**: Every account belongs to exactly one household. All members of the household can see and transact against it (based on their role).
- **Transactions**: Transactions are recorded against a specific account. The account's balance is derived from the sum of all its transactions.
- **Default Account**: Each household member can designate one account as their default, which is pre-selected when creating transactions.
- **CSV Import**: During import, CSV values can be mapped to specific accounts so imported transactions are assigned to the correct account.

## Managing Accounts

### Creating an Account

Household Admins and Owners can create accounts:

1. Navigate to the Accounts section
2. Click "Create Account"
3. Enter a name and optional technical identifier
4. The account is now available for transactions

### Editing and Deleting

Accounts can be renamed or have their technical identifier updated at any time. Deleting an account will also delete all associated transactions.

::: warning
Deleting an account permanently removes all transactions linked to it. This action cannot be undone.
:::
