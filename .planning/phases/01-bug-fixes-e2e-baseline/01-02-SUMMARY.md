---
phase: 01-bug-fixes-e2e-baseline
plan: 02
subsystem: ui
tags: [cypress, cypress-real-events, keyboard-navigation, accessibility, select-field, radix, tab-order, tsc]

# Dependency graph
requires: []
provides:
  - "SelectField.tsx trigger restored to native Tab order (tabIndex + Enter/Space/ArrowDown keyboard activation), scoped to the SelectField instance only — shared InputGroup component and its other consumers (e.g. TableToolbar search) untouched"
  - "Permanent Cypress regression spec (test/cypress/e2e/formKeyboardNavigation.spec.ts) proving the full forward Tab / exact-reverse Shift+Tab path through the transaction form, keyboard-operability of all five select triggers, Value Date's unchanged click behaviour, and toolbar-search containment"
  - "cypress-real-events@1.15.0 devDependency, installed after human package-legitimacy approval, with its Chainable.realPress type declared locally in test/cypress/support/e2e.ts (the package's own support.d.ts subpath ships no types)"
affects: [01-03, 01-04]

# Actuals (#2632)
actuals:
  tokens: 3675
  tasks: 3
  commits: 3

tech-stack:
  added: ["cypress-real-events@1.15.0"]
  patterns: ["Scoped tabIndex/onKeyDown fix on a single component instance rather than a shared UI primitive's defaults", "Programmatic Tab-order recording in Cypress (no hard-coded element list) via a recursive cy.realPress + cy.focused() walk"]

key-files:
  created:
    - test/cypress/e2e/formKeyboardNavigation.spec.ts
  modified:
    - src/lib/components/common/form/elements/SelectField.tsx
    - test/cypress/support/e2e.ts
    - package.json
    - yarn.lock

key-decisions:
  - "Task 1's blocking-human package-legitimacy checkpoint for cypress-real-events@1.15.0 was approved by the user (plain-text 'approved' response relayed by the orchestrator); install proceeded exactly as researched."
  - "Task 2's thin tracer test targets the Account select trigger via two Shift+Tab presses from the Name input, not one: the standard test household has exactly one account, so TransactionForm.tsx pre-fills Account with a default value, rendering a real, always-focusable clear (X) button as a genuine intervening tab stop between the trigger and Name (planner_assumptions #3). The plan's action text described a single press; corrected during implementation per Rule 1 (bug in the plan's own test design, not the production code) after the first pre-fix run's failure trace and a rebuild-and-rerun cycle confirmed the corrected two-press version passes only once the SelectField.tsx fix is applied."
  - "Declared cy.realPress's signature locally in test/cypress/support/e2e.ts's existing declare global Chainable interface, per the plan's own documented fallback ('do not add realPress ... unless TypeScript actually reports it missing'). tsc did report it missing: cypress-real-events ships its Chainable type augmentation from its index.d.ts entry point, but the runtime registration import used here (cypress-real-events/support, per the package's documented runtime-registration pattern) resolves to a support.d.ts that is intentionally empty. This is a Rule 1 fix — it doesn't change runtime behavior (Cypress transpiles specs without full program-wide type-checking, which is why the tests ran successfully even before this fix) but restores real IDE/tsc type-safety for a devDependency this plan introduced."
  - "identifyFocused()'s stable-identity function in the spec (label-for value, or name attribute, or a distinct ':clear' suffix for a field's own clear button) intentionally distinguishes a trigger from its own clear button so the anchor assertion's 'exactly once' check isn't violated by Account's and Value Date's legitimate, pre-filled-default-value clear buttons."

patterns-established:
  - "Scope a keyboard/focus fix to the single component instance responsible (SelectField.tsx's own InputGroup props), never to a shared UI primitive's defaults, when that primitive has other consumers with different focus semantics (TableToolbar's plain search InputGroup)."

requirements-completed: [BUG-02]

coverage:
  - id: D1
    description: "Every SelectField trigger in the transaction form (Account, Type, Category, Counterparty, Tags) is reachable via native Tab/Shift+Tab, in exact visual/DOM order, with no skip and no trap"
    requirement: "BUG-02"
    verification:
      - kind: e2e
        ref: "test/cypress/e2e/formKeyboardNavigation.spec.ts#visits every date and select field anchor in relative forward order, and Shift+Tab retraces the exact reverse"
        status: pass
    human_judgment: false
  - id: D2
    description: "A focused SelectField trigger opens its popover on Enter, Space, and ArrowDown"
    requirement: "BUG-02"
    verification:
      - kind: e2e
        ref: "test/cypress/e2e/formKeyboardNavigation.spec.ts#select trigger keyboard operability (UI-SPEC consideration 3) — 15 it() blocks (5 triggers x 3 keys)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Value Date trigger is Tab-reachable and its click-to-open calendar behaviour is unaffected by the fix"
    requirement: "BUG-02"
    verification:
      - kind: e2e
        ref: "test/cypress/e2e/formKeyboardNavigation.spec.ts#keeps the Value Date trigger's click-to-open calendar behaviour unchanged by the fix (UI-SPEC consideration 5)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Search inputs elsewhere that use the shared InputGroup component (e.g. Transactions list toolbar) keep their existing focus behaviour — the group wrapper is not an extra tab stop"
    requirement: "BUG-02"
    verification:
      - kind: e2e
        ref: "test/cypress/e2e/formKeyboardNavigation.spec.ts#does not disturb search inputs elsewhere that use InputGroup (UI-SPEC consideration 6)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A sighted keyboard user can visibly see focus on a newly-focusable Select trigger (focus-visible ring)"
    verification: []
    human_judgment: true
    rationale: "Plan Task 3's <verify> includes an explicit <human-check> item for visual focus-ring judgment; config.json sets human_verify_mode: end-of-phase, so this is deferred to end-of-phase UAT rather than blocking this plan, matching the precedent set by 01-01's SUMMARY."

duration: 39min
completed: 2026-08-25
status: complete
---

# Phase 1 Plan 2: Transaction Form Keyboard Navigation Fix Summary

**Restored native Tab order to all five SelectField triggers in the transaction form by adding a scoped tabIndex + Enter/Space/ArrowDown keyboard handler to SelectField.tsx's own InputGroup instance, proven by a 19-test cypress-real-events regression spec covering the exact forward/reverse Tab path, keyboard operability, and unaffected sibling behavior (Value Date, toolbar search).**

## Performance

- **Duration:** 39 min (spans a `blocking-human` checkpoint pause between dispatches; the first dispatch halted immediately at Task 1 with zero work done, then a continuation agent executed Tasks 2-3 after human approval)
- **Started:** 2026-08-25T11:57:00Z
- **Completed:** 2026-08-25T12:36:13Z
- **Tasks:** 3/3 completed
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- Root-caused and fixed BUG-02 (#76): `SelectField.tsx`'s Radix `PopoverTrigger asChild` was cloning trigger behavior onto a plain `InputGroup` div with no `tabIndex`, dropping every Select field (Account, Type, Category, Counterparty, Tags) out of the native Tab order at once. Added `tabIndex={readonly ? -1 : 0}`, an `onKeyDown` handler (Enter/Space/ArrowDown open the popover, guarded to the trigger element itself), and a focus-visible ring — scoped entirely to the `InputGroup` instance inside `SelectField.tsx`, leaving the shared `InputGroup` component and its other consumers (e.g. `TableToolbar`'s search input) untouched.
- Installed `cypress-real-events@1.15.0` after the human approved the package-legitimacy checkpoint, and registered its runtime import in `test/cypress/support/e2e.ts`.
- Wrote `test/cypress/e2e/formKeyboardNavigation.spec.ts` (19 passing `it` blocks): a thin tracer proving the Account trigger is reachable and opens on Enter, a comprehensive recorded-path test proving all nine date/select anchors appear exactly once in forward order and that Shift+Tab is the exact element-for-element reverse (D-06), 15 keyboard-operability assertions (5 triggers x Enter/Space/ArrowDown), a Value Date click-behavior regression check, and a toolbar-search containment check.
- Fixed a real type-safety gap introduced by the new devDependency: `cypress-real-events`'s `Chainable.realPress` augmentation lives in its `index.d.ts`, not the `support.d.ts` subpath this project's runtime registration import resolves to (which is empty) — declared `realPress`'s signature locally in `e2e.ts`'s existing `declare global` block, per the plan's own documented fallback instruction, restoring `tsc --noEmit` cleanliness for the new devDependency's usage sites.

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify cypress-real-events package legitimacy before install** — `5e0eac6` (docs) — halt-at-checkpoint SUMMARY, committed by the first dispatch before returning the checkpoint. Superseded by this SUMMARY.
2. **Task 2: Drive a real Tab key press to a Select trigger and make focus land there** — `881d4b1` (feat) — SelectField.tsx fix, cypress-real-events install, support-file registration, thin tracer spec.
3. **Task 3: Assert the full forward path and its exact reverse across every date and select field** — `6d7ad31` (test) — full Interaction Order Contract coverage, plus the `e2e.ts` `realPress` type declaration fix.

**Plan metadata:** (this commit) `docs: complete 01-02 plan`

_Note: Task 3 carried `tdd="true"` but required no `feat(...)` commit — see "TDD Gate Compliance" below._

## Files Created/Modified

- `test/cypress/e2e/formKeyboardNavigation.spec.ts` (created) — 19-test regression spec for the transaction form's keyboard navigation contract.
- `src/lib/components/common/form/elements/SelectField.tsx` (modified) — added `tabIndex`, `onKeyDown` (Enter/Space/ArrowDown), and a focus-visible ring to the trigger `InputGroup` instance.
- `test/cypress/support/e2e.ts` (modified) — registered `cypress-real-events/support`; declared `realPress`'s `Chainable` type locally.
- `package.json` / `yarn.lock` (modified) — added `cypress-real-events@1.15.0` devDependency.

## Decisions Made

- Approved `cypress-real-events@1.15.0` for install per the human's "approved" response to the Task 1 checkpoint; no alternative package was requested.
- Corrected the thin tracer's Shift+Tab press count from one to two, since Account's pre-filled default value (standard test household has exactly one account) renders a real, always-focusable clear button as a genuine intervening tab stop — documented above under key-decisions with full reasoning.
- Declared `cy.realPress`'s type locally rather than relying solely on the package's own type augmentation, since `tsc` reported it missing (the package's documented fallback path, explicitly anticipated by the plan's own interface_context).
- Scoped the tabIndex/keyboard fix strictly to `SelectField.tsx`'s own `InputGroup` instance (via inline props), not to the shared `InputGroup` component's defaults — `src/lib/components/ui/input-group.tsx` is byte-identical to its phase-start state (verified via `git diff --stat`, empty output, at both Task 2 and Task 3 checkpoints).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected Task 2's thin tracer test to use two Shift+Tab presses, not one**
- **Found during:** Task 2, first post-fix test run (still failed with the exact same `AssertionError: ... to be 'focused'` as the pre-fix run, even after the `SelectField.tsx` fix and a rebuild)
- **Issue:** The plan's `<action>` text described a single Shift+Tab press from the Name input landing on the Account trigger. In the actual DOM, Account's pre-filled default value (the standard test household has exactly one account, so `TransactionForm.tsx` auto-selects it) renders a real, always-focusable clear ("X") button as a legitimate additional tab stop between the trigger and Name — unaffected by this bug, since it's a native `<button>`. A single Shift+Tab from Name lands on that clear button, not the trigger.
- **Fix:** Changed the test to press Shift+Tab twice (Name -> clear button -> trigger), matching the actual, correct native tab order. Confirmed this correctly fails pre-fix (trigger was fully out of tab order in either direction) and passes post-fix.
- **Files modified:** test/cypress/e2e/formKeyboardNavigation.spec.ts
- **Verification:** Full pre-fix run captured showing the documented failure; full post-fix run with the corrected assertion passing in 10s with no retries.
- **Committed in:** 881d4b1 (Task 2 commit)

**2. [Rule 1 - Bug] Declared cy.realPress's Chainable type locally in test/cypress/support/e2e.ts**
- **Found during:** Task 3, running `yarn tsc --noEmit` as an extra verification step beyond the plan's listed `<verify>` commands
- **Issue:** `cypress-real-events`'s `Chainable.realPress` type augmentation lives in the package's `index.d.ts` entry point, but this project's runtime registration (`import "cypress-real-events/support"`, the package's own documented pattern, per RESEARCH.md) resolves to a `support.d.ts` subpath that is intentionally empty (`export {};`). `tsc --noEmit -p tsconfig.json` reported `Property 'realPress' does not exist on type 'cy & CyEventEmitter'` across both Task 2's and Task 3's `cy.realPress` call sites. This did not block cypress's own test runner (which transpiles specs without full program-wide type-checking, hence tests passed at runtime regardless), but it is a real IDE/type-safety gap this plan's own devDependency introduced.
- **Fix:** Declared `realPress(keyOrShortcut: string | string[], options?: {...}): Chainable<void>` in `e2e.ts`'s existing `declare global { namespace Cypress { interface Chainable {...} } }` block, matching the file's established pattern for other custom commands, and per the plan's own interface_context instruction: "do not add `realPress` to the local `declare global` Chainable interface unless TypeScript actually reports it missing" — it did.
- **Files modified:** test/cypress/support/e2e.ts
- **Verification:** `yarn tsc --noEmit -p tsconfig.json` — zero errors on `formKeyboardNavigation.spec.ts` or `e2e.ts` after the fix (two pre-existing, unrelated type errors remain in `test/cypress/e2e/mobile.spec.ts` and `test/vitest/.../attachmentRoutes.test.ts` — out of scope per this task's boundary, not touched).
- **Committed in:** 6d7ad31 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 test-design bug in the plan's own thin-tracer description, 1 missing type declaration for a newly-installed devDependency).
**Impact on plan:** Both fixes were necessary for the plan's own acceptance criteria to hold true (a correct, passing regression test; and `tsc` cleanliness implied by treating a new devDependency correctly). No scope creep — neither fix touched production behavior beyond what Task 2's `<action>` already specified.

## TDD Gate Compliance

Task 3 carried `tdd="true"` and a `<behavior>` block. Per the standard RED -> GREEN cycle, a failing test should precede a passing one. Here, the full 19-test extended spec (anchor/reverse-order assertion, 15 keyboard-operability checks, Value Date click check, toolbar containment check) **passed on its first run** with zero retries — no RED phase occurred, because Task 2's `SelectField.tsx` fix already fully implemented the behavior Task 3 exhaustively verifies; Task 3 adds proof, not new production code. This is the same anticipated "no RED phase" outcome documented in `01-01-SUMMARY.md`'s own TDD Gate Compliance section for an analogous reason (diagnosis/verification task, not a fix task). No separate `feat(...)` commit exists for Task 3 — only `test(01-02): prove the full forward/reverse Tab order contract` (`6d7ad31`).

## Issues Encountered

- Docker Desktop was not running at the start of the continuation dispatch (`docker ps` failed with `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`), blocking any Testcontainers-backed Cypress run. Launched Docker Desktop and polled until the daemon responded (~30-60s) before proceeding — an environment prerequisite, not a plan deviation, consistent with 01-01's SUMMARY noting a similar one-time local-environment setup cost (there: a missing production build).
- A local production build (`yarn build`) was required before each `test:start:app` E2E run; rebuilt once after applying the `SelectField.tsx` fix so the running server reflected the change (the fix wasn't picked up by the E2E run until rebuilt, since `test:start:app` runs `blitz start` against `.next`, not a dev server).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase success criterion 2 (BUG-02, #76) is met: a permanent, passing Cypress spec proves forward Tab and exact-reverse Shift+Tab through the transaction form, with no field skipped or trapped, and every select trigger keyboard-operable.
- **Deferred to end-of-phase UAT (per `config.json`'s `human_verify_mode: end-of-phase`):** Task 3's `<human-check>` — manually confirming the focus-visible ring is visibly clear when Tab-ing through `/transactions/new` by hand. The automated spec proves focus *lands* correctly and *behaves* correctly (opens on Enter/Space/ArrowDown); it cannot judge visual clarity of the ring itself.
- Sibling plan 01-01 (Counterparty filter diagnosis) was not touched by this plan — no file overlap occurred.
- This plan's `SelectField.tsx` change is the only production code change; `src/lib/components/ui/input-group.tsx` (the shared component) remains byte-identical to its phase-start state, so no other `InputGroup` consumer in the app (e.g. `AmountField.tsx`, `TableToolbar.tsx`) is affected.

## Self-Check

- FOUND: test/cypress/e2e/formKeyboardNavigation.spec.ts
- FOUND: src/lib/components/common/form/elements/SelectField.tsx (modified, tabIndex/onKeyDown present)
- FOUND: test/cypress/support/e2e.ts (modified, cypress-real-events/support import + realPress type present)
- FOUND: 5e0eac6 (git log)
- FOUND: 881d4b1 (git log)
- FOUND: 6d7ad31 (git log)

## Self-Check: PASSED

---
*Phase: 01-bug-fixes-e2e-baseline*
*Completed: 2026-08-25*
