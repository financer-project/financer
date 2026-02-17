# Counterparties

**Counterparties** represent the other party in a transaction - who you paid or who paid you. Tracking counterparties helps you understand your financial relationships and spending patterns by vendor, employer, or service provider.

## Counterparty Properties

| Property | Description |
|----------|-------------|
| Name | Display name of the counterparty |
| Type | Classification of the counterparty (see types below) |
| Description | Optional description |
| Account Name | Optional account name or reference number |
| Web Address | Optional website URL |

## Counterparty Types

Financer supports 16 counterparty types to accurately classify your financial relationships:

| Type | Description | Example |
|------|-------------|---------|
| `INDIVIDUAL` | A private person | Friend, family member |
| `MERCHANT` | A retail business | Amazon, local grocery store |
| `EMPLOYER` | An employer paying salary | Your company |
| `GOVERNMENT` | A government entity | Tax office, DMV |
| `UTILITY` | A utility provider | Electric company, water supplier |
| `SERVICE_PROVIDER` | A service business | Internet provider, cleaning service |
| `LENDER` | An entity lending money | Bank (for loans), credit union |
| `BORROWER` | An entity borrowing money | Someone you lent money to |
| `CHARITY` | A charitable organization | Red Cross, local charity |
| `INSURANCE` | An insurance provider | Health insurance, car insurance |
| `HEALTHCARE` | A healthcare provider | Doctor, hospital, pharmacy |
| `EDUCATION` | An educational institution | University, online course |
| `LANDLORD` | A property owner you rent from | Your landlord |
| `INVESTMENT_FIRM` | An investment company | Brokerage, fund manager |
| `PLATFORM` | A digital platform | PayPal, Uber, Airbnb |
| `OTHER` | Anything that doesn't fit above | Miscellaneous |

## Scope

Counterparties belong to a household. Each household maintains its own counterparty list, so you can track different counterparties for different financial contexts.

## Using Counterparties

When creating or editing a transaction, you can optionally select a counterparty. This allows you to later analyze:

- How much you've spent at a particular merchant
- Your total income from a specific employer
- Payment history with a service provider

## Managing Counterparties

Admins and Owners can create, edit, and delete counterparties. During CSV import, counterparties can be mapped from CSV values to existing counterparties in the system.
