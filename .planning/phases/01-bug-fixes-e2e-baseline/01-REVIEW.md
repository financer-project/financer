---
phase: 01-bug-fixes-e2e-baseline
reviewed: 2026-08-26T06:24:10Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - .github/workflows/ci.yml
  - cypress.config.ts
  - package.json
  - src/lib/components/common/form/elements/SelectField.tsx
  - test/cypress/e2e/formKeyboardNavigation.spec.ts
  - test/cypress/e2e/transactions.spec.ts
  - test/cypress/support/e2e.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-26T06:24:10Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This phase splits the monolithic CI job into parallel `build-and-lint` / `unit-tests` / `component-tests` / `e2e-tests` / `merge-coverage-and-sonar` jobs, adds Cypress sharding (`cypress-split`) and real keyboard events (`cypress-real-events`), fixes keyboard operability of `SelectField`'s trigger (tabIndex + Enter/Space/ArrowDown handling), and adds two new/extended E2E specs (`formKeyboardNavigation.spec.ts`, and a new counterparty-filter regression test in `transactions.spec.ts`).

The CI restructuring itself is internally consistent: coverage output directories match `nyc.config.js` / `vitest.config.ts`, the `yarn db:generate` steps were correctly added to the newly-split jobs (needed now that they no longer inherit `build-and-lint`'s filesystem), and the shard count matches the current spec-file count. The `SelectField.tsx` keyboard fix is narrowly scoped to the component's own `InputGroup` instance and does not leak into the shared `InputGroup` primitive (verified against the "does not disturb search inputs" test).

The most serious problem is in the new counterparty-filter regression test itself: it installs a per-test `uncaught:exception` handler that unconditionally returns `false`, which silences the CI-wide failure-on-uncaught-exception behavior for exactly the bug class (BUG-01) the test exists to catch. A few smaller type-safety and maintainability issues round out the findings.

## Critical Issues

### CR-01: Counterparty-filter regression test cannot fail on the exception it targets

**File:** `test/cypress/e2e/transactions.spec.ts:124-130`
**Issue:** The global handler in `test/cypress/support/e2e.ts:104-106` fails a test on any uncaught exception except two explicitly allow-listed React/Next errors — that is the mechanism by which an E2E test would normally catch a regression of "BUG-01" (an uncaught exception thrown while filtering by counterparty). This test installs a second, test-scoped handler:

```ts
cy.on("uncaught:exception", (err) => {
    // eslint-disable-next-line no-console
    console.log("[BUG-01 diagnosis] uncaught exception:", err.message, "\n", err.stack)
    return false
})
```

Cypress treats an `uncaught:exception` event as "handled" (test not failed) if *any* registered listener returns `false`, regardless of what other listeners return. Because this handler returns `false` unconditionally — for every possible error message, not just known-benign ones — it fully disables the global fail-on-exception safety net for the remainder of this specific test. If the production bug this test was written to diagnose ever recurs (throwing an uncaught exception during the counterparty-filter interaction), the test will not fail because of that exception; it will only fail if a later explicit assertion happens to also detect the corrupted state. Since several of this test's later steps re-query `cy.get("tbody tr")` counts that could plausibly still match by coincidence (e.g., transient exceptions that don't blank the page), this converts a "regression test for BUG-01" into a test that structurally cannot regression-test the exception itself — the opposite of the stated intent in the surrounding comment ("log the real error instead of letting Cypress swallow it"), which describes *logging* but the `return false` line actually *swallows* it in the failure sense that matters for CI.
**Fix:** Track whether an exception occurred and assert on it explicitly instead of unconditionally suppressing failure, e.g.:

```ts
let uncaughtError: Error | undefined
cy.on("uncaught:exception", (err) => {
    uncaughtError = err
    console.log("[BUG-01 diagnosis] uncaught exception:", err.message, "\n", err.stack)
    return false
})

// ... rest of the test ...

cy.then(() => {
    expect(uncaughtError, uncaughtError ? `uncaught exception: ${uncaughtError.message}` : undefined).to.be.undefined
})
```

This preserves the diagnostic logging while still failing the test (with the captured stack trace in the failure message) if BUG-01 recurs — restoring the protection the global handler already provides everywhere else.

## Warnings

### WR-01: `realPress` type declaration silently widens the key-name type, losing compile-time validation

**File:** `test/cypress/support/e2e.ts:56-63`
**Issue:** The actual `cypress-real-events` package types the key argument as `Key | Array<Key>` where `Key = keyof typeof keyCodeDefinitions` (`node_modules/cypress-real-events/commands/realPress.d.ts`), i.e. a closed literal union validated against the library's own key table. This project declares its own ambient override as `keyOrShortcut: string | string[]`, which accepts *any* string. A typo such as `cy.realPress("Retrun")` or `cy.realPress("Esacpe")` will type-check successfully and only fail at runtime (or silently no-op), instead of being caught by `tsc`/the IDE the way the upstream types would catch it.
**Fix:** Reuse the library's own types instead of re-declaring a looser one:

```ts
import type { RealPressOptions } from "cypress-real-events/commands/realPress"
import type { keyCodeDefinitions } from "cypress-real-events/keyCodeDefinitions"

type Key = keyof typeof keyCodeDefinitions

realPress(keyOrShortcut: Key | Key[], options?: RealPressOptions): Chainable<void>
```

### WR-02: E2E shard count is a hand-maintained magic number with no automated safeguard

**File:** `.github/workflows/ci.yml:164-177`
**Issue:** The comment correctly documents that the `shard: [1, 2, 3, 4]` matrix must stay at or below the number of `test/cypress/e2e/**/*.spec.ts` files, and that a shard with zero assigned specs fails outright. This invariant is enforced only by a human remembering to update this array (and the comment) whenever a spec file is added or removed — there is no CI step that asserts `specCount >= shardCount` before the matrix runs. If a future spec file is deleted (currently 15 files for 4 shards) without anyone revisiting this comment, one shard could silently start receiving zero specs and fail for a non-obvious reason.
**Fix:** Not required to fix immediately, but consider either deriving the shard count in a preliminary job step (`ls test/cypress/e2e/**/*.spec.ts | wc -l` gated against the hardcoded matrix), or adding a lightweight lint/test that asserts `specFileCount >= SHARD_COUNT` so a mismatch fails fast with a clear message instead of a confusing "0 specs" shard failure.

### WR-03: Unsafe `option.value as string` cast used as a React `key` for non-string generic values

**File:** `src/lib/components/common/form/elements/SelectField.tsx:185, 254`
**Issue:** `SelectField<T>` is generic and `option.value: T` is not constrained to `string`. Both list-rendering sites cast it directly: `key={option.value as string}`. When `T` is not naturally string-like (e.g. a plain object, or `undefined`/`null` sentinel values), this cast produces the same key (e.g. `"[object Object]"`) for multiple options, causing React to warn about duplicate keys and — more importantly — potentially reuse/misrender list item state across options that share the coerced key. This is not introduced by this phase's diff, but it is present in the file under review and is exercised by consumers that could plausibly pass non-string/non-number values (the component's public generic contract does not forbid it).
**Fix:** Derive a stable string key without relying on an unchecked cast, e.g. `key={typeof option.value === "object" ? JSON.stringify(option.value) : String(option.value)}` (mirroring the existing `JSON.stringify` equality checks already used elsewhere in this same file for value comparison), or constrain `SelectOption<T>` to require callers to supply an explicit `id: string` for the key.

## Info

### IN-01: Keyboard-operability fix does not add corresponding ARIA semantics

**File:** `src/lib/components/common/form/elements/SelectField.tsx:205-225`
**Issue:** The fix correctly makes the trigger focusable (`tabIndex`) and operable via Enter/Space/ArrowDown, closing the keyboard-navigation gap the new E2E spec targets. However, the element still uses a non-standard `role="select-field"` with no `aria-haspopup`, `aria-expanded`, or `aria-controls`. Unknown ARIA role values are ignored by assistive technology, so a screen reader user tabbing to this control still gets no indication it is an interactive listbox/combobox trigger or whether it is currently open — only sighted keyboard users benefit from this fix.
**Fix:** Consider layering `role="combobox"`, `aria-expanded={isOpen}`, and `aria-haspopup="listbox"` onto the trigger in a follow-up, since the underlying interaction model (Enter/Space/ArrowDown to open) already matches the standard combobox pattern.

### IN-02: `identifyFocused`'s clear-button heuristic assumes the popover portal is never a DOM descendant of the trigger

**File:** `test/cypress/e2e/formKeyboardNavigation.spec.ts:29-33`
**Issue:** `identifyFocused` labels any focused element whose closest ancestor has `role="select-field"` as `"<fieldName>:clear"`, on the assumption that the only focusable descendant of the trigger (besides the trigger itself) is the clear button. This holds today because Radix's `PopoverContent` renders through a portal outside the trigger's subtree. If that ever changes (e.g. `modal`/portal behavior configuration, or a future non-portaled variant), any focusable element inside the open popover (e.g. the search input) would be mislabeled as the field's clear button, silently corrupting the recorded path in `walkForwardToSubmit`/`walkBackward` rather than failing loudly.
**Fix:** No action required now; if the trigger/popover DOM relationship changes, add a guard (e.g. exclude elements inside `[role='dialog']`) to keep this heuristic accurate.

---

_Reviewed: 2026-08-26T06:24:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
