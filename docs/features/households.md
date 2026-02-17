# Households

A **Household** is the top-level organizational unit in Financer. It represents a group of people who share financial tracking - typically a family, a couple, or even just an individual managing their own finances.

## Why Households?

Households exist because personal finance is rarely truly personal. Most people share at least some financial responsibilities with others - a partner, spouse, or family. Households provide:

- **Shared visibility** - All members can see the same accounts and transactions
- **Independent data** - Each household has its own accounts, categories, tags, and counterparties, keeping things organized if you manage multiple contexts (e.g., personal vs. a shared household)
- **Access control** - Different members can have different levels of access based on their role
- **Currency scoping** - Each household has a single currency, so all financial data within it is consistent

A user can belong to multiple households. For example, you might have a personal household for your individual finances and a shared household with your partner for joint expenses.

## Household Properties

| Property | Description |
|----------|-------------|
| Name | Display name for the household |
| Description | Optional description |
| Currency | The currency used for all transactions in this household (e.g., USD, EUR) |

## Roles

Each member of a household is assigned a role that determines what they can do:

| Role | Permissions |
|------|------------|
| **Owner** | Full access. Can manage the household itself, invite/remove members, and manage all resources. There is one owner per household (the creator). |
| **Admin** | Can create and manage categories, accounts, tags, and counterparties. Can invite new members. |
| **Member** | Can create and manage transactions, run imports, and attach files. Cannot modify household structure (categories, accounts, etc.). |
| **Guest** | Read-only access. Can view accounts, transactions, and reports but cannot modify anything. |

## Creating a Household

During onboarding, your first household is created automatically. To create additional households:

1. Navigate to the household section
2. Create a new household with a name, optional description, and currency
3. You automatically become the owner of the new household

## Inviting Members

Owners and Admins (if permitted by the system administrator) can invite new members:

1. Go to the household settings
2. Enter the email address of the person you want to invite
3. Select the role to assign them
4. An invitation link is generated (and emailed if SMTP is configured)

The invited user can then sign up using the invitation link and will automatically be added to the household with the assigned role.

## Default Account

Each member of a household can set a **default account**. This is the account that is pre-selected when creating new transactions, saving time for the most commonly used account.
