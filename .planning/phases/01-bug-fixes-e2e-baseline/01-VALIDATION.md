---
phase: 1
slug: bug-fixes-e2e-baseline
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Cypress 15.10.0 (E2E + component), Vitest 3.2.4 (unit) |
| **Config file** | `cypress.config.ts` (e2e + component), `vitest.config.ts` (unit) |
| **Quick run command** | `yarn test:unit` (fast, pure-logic changes) / `cypress run --e2e --spec <path>` (single spec during development) |
| **Full suite command** | `yarn test` (unit + component + e2e + coverage merge) |
| **Estimated runtime** | Full E2E suite currently sequential — recorded as part of Phase 1's own baseline (D-10/D-11); no pre-existing number to cite |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit` for pure-logic changes; targeted `cypress run --e2e --spec <changed spec>` for UI fixes
- **After every plan wave:** Run `yarn test` (full suite) — note shape changes once TEST-01's CI restructuring lands; until then the existing sequential command still works locally
- **Before `/gsd-verify-work`:** Full suite green in CI (post-restructuring: all matrix shards + merge-coverage job green), plus the 3-consecutive-run flake check from success criterion 4
- **Max feedback latency:** 300 seconds (current sequential Cypress suite is the ceiling until TEST-01 lands; tightens once parallelized)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | BUG-01 | — | N/A | e2e | `cypress run --e2e --spec test/cypress/e2e/transactions.spec.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | BUG-01 | — | N/A | e2e | `cypress run --e2e --spec test/cypress/e2e/transactions.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | BUG-02 | — | N/A | e2e | `cypress run --e2e --spec test/cypress/e2e/transactions.spec.ts` (or new dedicated spec) | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1-2 | TEST-01 | — | N/A | infra | GitHub Actions workflow run duration + `.test/lcov.info` diff, captured in `BASELINE.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/cypress/e2e/transactions.spec.ts` — add Counterparty filter test cases (single/multi/clear), once BUG-01's actual behavior is understood via reproduction
- [ ] `test/cypress/e2e/transactions.spec.ts` (or new spec) — add Tab/Shift+Tab order test using `cy.realPress('Tab')` / `cy.realPress(['shift','Tab'])`
- [ ] `test/cypress/support/e2e.ts` — register `cypress-real-events`'s commands (`import "cypress-real-events/support"`)
- [ ] `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` — does not exist yet; must be created from an actual CI run's numbers (D-10/D-11), not authored ahead of time
- [ ] Framework install: `yarn add -D cypress-split@1.25.0 cypress-real-events@1.15.0` (behind `checkpoint:human-verify` — both packages are `[ASSUMED]` per WebSearch-discovery provenance rule)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BUG-01 root-cause reproduction | BUG-01 | No known repro steps exist; static trace found no defect — requires live execution with Docker/Testcontainers available (unavailable in the research sandbox) | Run dev server + local MySQL container, exercise Counterparty filter (single-select, multi-select, clear) in a browser, capture actual error/stack trace before writing the fix |
| Shard-count tuning (D-09) | TEST-01 | No fixed shard count specified — must be measured empirically via real CI runs, not estimated statically | Push baseline commit, read GitHub Actions' reported duration across candidate shard counts, pick the count with the best wall-clock/runner-overhead tradeoff (diminishing returns expected past ~4-6 shards for 14 spec files) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
