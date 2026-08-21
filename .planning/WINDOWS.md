---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-21T22:18:01.222Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | deviation | src/app/(internal)/transactions/components/TransactionsList.tsx | 67 | Tag filter (property: tagId) throws PrismaClientValidationError: Unknown argument tagId - no scalar tagId exists on Transaction, only the tags relation. Reproduces with zero Counterparty interaction; likely source of the originally-reported #78 crash misattributed to Counterparty. Out of scope for BUG-01/plan 01-01 - route through /gsd-capture. | open |  | 2026-08-21T22:18:01.222Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "01",
    "file": "src/app/(internal)/transactions/components/TransactionsList.tsx",
    "line": 67,
    "description": "Tag filter (property: tagId) throws PrismaClientValidationError: Unknown argument tagId - no scalar tagId exists on Transaction, only the tags relation. Reproduces with zero Counterparty interaction; likely source of the originally-reported #78 crash misattributed to Counterparty. Out of scope for BUG-01/plan 01-01 - route through /gsd-capture.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T22:18:01.222Z",
    "resolved_at": null
  }
]
````
