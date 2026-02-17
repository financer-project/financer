# CSV Import

Financer supports importing transactions from CSV files exported by your bank. The import process uses a step-by-step wizard to map your bank's CSV format to Financer's data model.

## Import Process

### Step 1: Upload CSV File

Upload the CSV file exported from your bank. Financer auto-detects the separator character (comma, semicolon, tab, etc.).

### Step 2: Column Mapping

Map CSV columns to Financer transaction fields:

| Transaction Field | Description |
|------------------|-------------|
| Name | Transaction title/reference |
| Amount | Transaction amount |
| Value Date | Date of the transaction |
| Description | Additional details |
| Type | Income or Expense |

You can also specify formats for date and amount fields to handle different regional formats (e.g., `DD.MM.YYYY` vs. `MM/DD/YYYY`).

### Step 3: Value Mapping

Map specific values found in the CSV to Financer entities:

- Map account identifiers to Financer **Accounts**
- Map category names to Financer **Categories**
- Map counterparty names to Financer **Counterparties**

This step ensures that imported transactions are correctly associated with the right entities in your household.

### Step 4: Review and Import

Review the mapping configuration and start the import. The import runs as a **background job** using a queue system, so you can continue using Financer while it processes.

## Import Status

Each import job tracks its progress through these states:

| Status | Description |
|--------|-------------|
| **Draft** | Import is being configured (column/value mapping in progress) |
| **Pending** | Configuration complete, waiting to be processed |
| **Processing** | Import is actively creating transactions |
| **Completed** | All transactions have been imported successfully |
| **Failed** | An error occurred during processing |

## Import Properties

| Property | Description |
|----------|-------------|
| Name | A descriptive name for this import job |
| File | The uploaded CSV file |
| Separator | CSV delimiter character (auto-detected, defaults to `,`) |
| Total Rows | Number of rows in the CSV |
| Processed Rows | Number of rows processed so far |
| Error Message | Error details if the import failed |

## Tips

- **Consistent exports**: Use the same CSV export format from your bank each time so you can reuse column mappings.
- **Review before importing**: Check the column and value mappings carefully before starting the import.
- **Technical identifiers**: Set the "Technical Identifier" on your accounts (e.g., IBAN) to make account mapping during import easier.
