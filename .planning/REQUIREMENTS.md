# Requirements: Financer

**Defined:** 2026-08-21
**Core Value:** Households can reliably track, categorize, and understand their shared finances together — accurate transaction data and household collaboration must always work.

## v1 Requirements

Requirements for the v1.1.0 milestone. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Counterparty filter on the Transaction List works without throwing an error (#78)
- [ ] **BUG-02**: Tab-key navigation correctly moves focus through date and select fields in forms (#76)

### Test Infrastructure

- [ ] **TEST-01**: Cypress E2E suite runs faster via sharded/parallel execution, with coverage no worse than the current baseline (#71)

### Dependencies

- [ ] **DEPS-01**: Prisma is migrated from 6.19.x to 7.x (driver adapter, `prisma.config.ts`, generator/import path updates), with the full test suite passing
- [ ] **DEPS-02**: All other dependencies are updated to their latest patch/minor versions within their current major versions

### Splitting Groups

- [ ] **GRP-01**: A registered user can create a Splitting Group (name, optional start/end period)
- [ ] **GRP-02**: The organizer can add members to a group, either registered Financer users or non-registered members identified by name
- [ ] **GRP-03**: Each member receives a permanent personal access link that grants full participant access without requiring registration or login
- [ ] **GRP-04**: A member (via their link) can add an expense/income entry with description, amount, currency, payer, and date
- [ ] **GRP-05**: A member can split an expense equally across all group members or equally across a specified subset of members
- [ ] **GRP-06**: A member (via their link) can edit or delete their own expenses
- [ ] **GRP-07**: A member (via their link) can view all expenses in the group
- [ ] **GRP-08**: A member (via their link) can view every member's running balance, computed per currency
- [ ] **GRP-09**: A member (via their link) can record a settlement between two members, represented as a "negative expense"
- [ ] **GRP-10**: A group can be marked time-limited with a start/end period
- [ ] **GRP-11**: Once a group is closed (end date passed or organizer closes it manually), no new expenses/income can be added, but viewing, settling debts, and personal access links remain fully available

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Splitting Groups

- **GRP-12**: Custom split by exact amount, percentage, or shares (beyond equal-all/equal-subset)
- **GRP-13**: Debt simplification / "suggested settlements" to minimize the number of settling payments
- **GRP-14**: Optional blended/converted balance display across currencies (requires an FX-rate source, which does not exist in Financer today)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Splitting Groups sharing the Household/Account/Transaction data model | Would entangle the public-link, non-registered-user access model with the household security boundary (CASL abilities, OWNER/ADMIN/MEMBER/GUEST roles) |
| Anonymous (non-registered) group creation | Removes accountability for group organizers; only registered users organize, members can still join without registering |
| Auto-expiring or one-time-use group access links | Contradicts the requirement that links must keep working permanently, even after group close, so stragglers can settle up later |
| Real-money payment processing / in-app settle-up transfers | Turns a self-hosted personal finance tracker into a regulated money-transmission surface; settlement stays a record of a payment that happened elsewhere |
| Recurring group expenses | Couples the Groups domain to the household recurring-transaction engine; not requested |
| Receipt scanning/attachments on group expenses | Nice-to-have, not part of the locked v1.1.0 scope |
| Major version bumps for dependencies other than Prisma | This milestone deliberately bounds upgrade risk to Prisma only; everything else stays patch/minor |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 1 | Pending |
| BUG-02 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| DEPS-01 | Phase 2 | Pending |
| DEPS-02 | Phase 2 | Pending |
| GRP-01 | Phase 3 | Pending |
| GRP-02 | Phase 3 | Pending |
| GRP-03 | Phase 3 | Pending |
| GRP-04 | Phase 4 | Pending |
| GRP-05 | Phase 4 | Pending |
| GRP-06 | Phase 4 | Pending |
| GRP-07 | Phase 4 | Pending |
| GRP-08 | Phase 4 | Pending |
| GRP-09 | Phase 4 | Pending |
| GRP-10 | Phase 5 | Pending |
| GRP-11 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-21*
*Last updated: 2026-08-21 after roadmap creation (traceability mapped)*
