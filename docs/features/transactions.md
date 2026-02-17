# Transactions

**Transactions** are the core data entity in Financer. They represent individual financial events - money coming in, going out, or moving between accounts.

## Transaction Types

| Type | Description |
|------|-------------|
| **Income** | Money received (e.g., salary, refund, investment return) |
| **Expense** | Money spent (e.g., groceries, rent, subscription) |
| **Transfer** | Money moved between accounts within the same household |

## Transaction Properties

| Property | Description |
|----------|-------------|
| Type | Income, Expense, or Transfer |
| Amount | The monetary value of the transaction |
| Value Date | The date the transaction occurred |
| Name | Short title for the transaction |
| Description | Optional longer description or notes |
| Account | The account this transaction belongs to |
| Category | Optional category for classification |
| Tags | Optional tags for additional labeling |
| Counterparty | Optional counterparty (who you transacted with) |
| Attachments | Optional file attachments (receipts, invoices, etc.) |

## Working with Transactions

### Creating a Transaction

Members, Admins, and Owners can create transactions:

1. Navigate to the Transactions section
2. Click "Create Transaction"
3. Select the type (Income, Expense, or Transfer)
4. Fill in the amount, date, and other details
5. Optionally assign a category, tags, and counterparty

### Filtering and Searching

The transaction list supports filtering by:

- Account
- Transaction type
- Category
- Date range
- Tags
- Counterparty

### Attachments

You can attach files to transactions, such as receipts, invoices, or bank statements. This provides a paper trail for your financial records.

Attachments are stored on the server's filesystem in the `data/` directory and linked to the transaction in the database.

### Transfers

A transfer is a special transaction type that represents money moving between two accounts in the same household. Transfers are marked with an `isTransfer` flag and do not affect the household's overall balance (since money is just moving internally).

## Relationship to Other Entities

- **Account**: Every transaction belongs to one account
- **Category**: A transaction can optionally have one category
- **Tags**: A transaction can have multiple tags (many-to-many relationship)
- **Counterparty**: A transaction can optionally reference one counterparty
- **Import Job**: If the transaction was created via CSV import, it references the import job
