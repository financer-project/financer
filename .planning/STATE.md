---
gsd_state_version: 1.0
milestone: v1.1.0
current_phase: 01
current_phase_name: Bug Fixes & E2E Baseline
status: executing
last_updated: "2026-10-07T00:00:00.000Z"
last_activity: 2026-10-07
last_activity_desc: Fresh start — planning synced to main, Phase 1 begins
workflow: branch-per-item (one branch per feature/bug-fix, merged to main)
---

# Project State

## Project Reference

See: .planning/PROJECT.md

**Core value:** Households can reliably track, categorize, and understand their shared finances together — accurate transaction data and household collaboration must always work.
**Current focus:** Phase 1 — Bug Fixes & E2E Baseline

## Current Position

Milestone: v1.1.0
Phase: 01 (Bug Fixes & E2E Baseline) — EXECUTING
Next item: BUG-01 (#78) on `fix/78-counterparty-filter`

## Phase 1 Item Checklist

- [ ] `fix/78-counterparty-filter` — BUG-01 (#78): reproduce, fix, verify, merge
- [ ] `fix/76-tab-navigation` — BUG-02 (#76): fix SelectField tab order, verify, merge
- [ ] `chore/71-e2e-performance` — TEST-01 (#71): baseline, speed up, prove coverage parity, merge

## Phase 2 Item Checklist

- [ ] `chore/deps-prisma-7` — Prisma 6->7 (spike-gated) + in-major dep refresh

## Phases 3-5 Item Checklist (#67 Splitting Groups)

- [ ] `feature/67-splitting-groups-foundation` — Foundation
- [ ] `feature/67-splitting-groups-expenses` — Expenses, Splits, Balances & Settlement
- [ ] `feature/67-splitting-groups-closure` — Time Limits & Close Semantics
