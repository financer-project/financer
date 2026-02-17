# Categories

**Categories** provide a hierarchical classification system for transactions. They are the primary way to organize your transactions by purpose or type of income/expense.

## Category Types

Categories are divided into two types, matching the transaction types they can be applied to:

| Type | Usage |
|------|-------|
| **Income** | Categories for income transactions (e.g., Salary, Freelance, Investments) |
| **Expense** | Categories for expense transactions (e.g., Groceries, Rent, Utilities) |

## Category Properties

| Property | Description |
|----------|-------------|
| Name | Display name of the category |
| Type | Income or Expense |
| Budget | Optional budget amount for tracking spending targets |
| Color | Optional color for visual identification in charts and lists |
| Description | Optional description |
| Parent | Optional parent category for hierarchical nesting |

## Hierarchical Categories

Categories support parent-child relationships, allowing you to create detailed classification trees:

```
Expenses
├── Housing
│   ├── Rent
│   ├── Utilities
│   └── Insurance
├── Food
│   ├── Groceries
│   └── Restaurants
└── Transportation
    ├── Fuel
    └── Public Transit
```

Child categories inherit the type (Income or Expense) from their parent. This hierarchy lets you analyze spending at different levels of detail - see total "Housing" expenses, or drill down into "Rent" vs. "Utilities".

## Budgets

Each category can have an optional **budget** amount. This allows you to set spending targets and track how your actual spending compares to your planned budget. Budget tracking is visible in the dashboard analytics.

## Scope

Categories belong to a household. Each household maintains its own set of categories, so different households can have different categorization schemes that match their specific needs.

## Managing Categories

Admins and Owners can create, edit, and delete categories. Members and Guests can view categories and assign them to transactions (Members only).

::: warning
Deleting a category does not delete associated transactions. Those transactions will simply have no category assigned.
:::
