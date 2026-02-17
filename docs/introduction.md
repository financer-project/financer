# Introduction

Financer is a self-hosted personal finance management application designed for individuals and households to track, categorize, and analyze financial transactions. It provides a collaborative environment where household members can work together to manage shared finances.

## Why Financer?

Managing personal finances often involves juggling multiple bank accounts, tracking expenses across family members, and trying to make sense of spending patterns. Financer solves this by providing:

- **A single place** to manage all your accounts and transactions
- **Household-based collaboration** so family members can contribute to shared financial tracking
- **Flexible categorization** with hierarchical categories, tags, and counterparties
- **Actionable insights** through dashboards and analytics
- **Data ownership** through self-hosting - your financial data never leaves your server

## Feature Overview

### Household Management
Create a household and invite members with different roles (Owner, Admin, Member, Guest). Each household maintains its own set of accounts, categories, tags, and counterparties.

### Accounts
Define your bank accounts, savings accounts, or any other financial accounts within a household. Every transaction is linked to an account.

### Transactions
Record income, expenses, and transfers. Attach categories, tags, counterparties, and even file attachments like receipts to each transaction.

### Categories
Organize transactions with hierarchical categories (parent and child categories). Set budgets per category and assign colors for quick visual identification.

### Tags
Apply flexible, cross-cutting labels to transactions for additional grouping beyond categories.

### Counterparties
Track who you transact with - merchants, employers, service providers, landlords, and more. Financer supports 16 different counterparty types.

### Dashboard & Analytics
View KPI metrics such as total balance, income, and expenses. Analyze spending with category distribution charts and track balance history over time.

### CSV Import
Import transaction data from bank exports using a step-by-step wizard that maps CSV columns and values to Financer entities.

### Administration
Configure system-wide settings including SMTP email, user registration policies, security token expiration, and default preferences.

## Tech Stack

Financer is built with modern, well-established technologies:

| Layer | Technology |
|-------|-----------|
| Framework | [Blitz.js](https://blitzjs.com) (full-stack React) |
| Frontend | [Next.js 15](https://nextjs.org), [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| UI Components | [Radix UI](https://www.radix-ui.com) |
| Database | [MySQL 9](https://www.mysql.com) |
| ORM | [Prisma 6](https://www.prisma.io) |
| Cache & Jobs | [Redis](https://redis.io) with [BullMQ](https://bullmq.io) |
| Charts | [Recharts](https://recharts.org) |
| Runtime | [Node.js 22](https://nodejs.org) |

## License

Financer is released under the [BSD 3-Clause License](https://github.com/financer-project/financer/blob/main/LICENSE).
