# Features Overview

Financer provides a comprehensive set of tools for managing personal and household finances. This section explains each feature in detail and how the different entities interact with each other.

## Core Concepts

Financer is built around a hierarchical data model where the **Household** is the central entity. Everything else - accounts, categories, tags, counterparties, and transactions - belongs to a household.

```
Household
├── Members (Users with Roles)
├── Accounts
│   └── Transactions
│       ├── Category
│       ├── Tags
│       ├── Counterparty
│       └── Attachments
├── Categories (hierarchical)
├── Tags
└── Counterparties
```

### How Entities Relate

1. A **User** joins a **Household** through a membership with a specific role
2. The household contains **Accounts** that represent real-world bank accounts
3. **Transactions** are recorded against an account and can be categorized using a **Category**, labeled with **Tags**, and linked to a **Counterparty**
4. **Categories** organize transactions into income and expense groups, optionally with parent-child hierarchies
5. **Tags** provide cross-cutting labels that work alongside categories
6. **Counterparties** represent the other party in a transaction (e.g., a merchant, employer, or landlord)

## Feature List

| Feature | Description |
|---------|-------------|
| [Households](/features/households) | Multi-user collaboration with role-based access |
| [Accounts](/features/accounts) | Bank account and financial account management |
| [Transactions](/features/transactions) | Income, expense, and transfer recording |
| [Categories](/features/categories) | Hierarchical transaction categorization with budgets |
| [Tags](/features/tags) | Flexible labeling system for transactions |
| [Counterparties](/features/counterparties) | Transaction partner management |
| [Dashboard & Analytics](/features/dashboard) | Visual reports and financial insights |
| [CSV Import](/features/import) | Bulk transaction import from bank exports |
