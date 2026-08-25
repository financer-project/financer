import { TestData } from "@/test/utility/TestUtility"

/**
 * Stable identity for a focused element, used to record the Tab-order walk without hard-coding
 * a guessed element list (UI-SPEC "Interaction Order Contract").
 *
 * - A `SelectField` trigger (`role="select-field"`) is identified by the `for` attribute of the
 *   `<label>` that immediately precedes it in the DOM (see FormElement.tsx / SelectFormField.tsx).
 * - A native form control (input/textarea) is identified by its `name` attribute, set via
 *   Formik's `useField` spread.
 * - A conditional clear ("X") button nested inside a `SelectField` trigger's own InputGroup, or
 *   a `DatePicker`'s own clear button, is identified as `<fieldName>:clear` — a distinct value
 *   from the field's primary trigger identity, since both are real, legitimate tab stops when a
 *   field has a default value (Account and Value Date in this form; see planner_assumptions #3).
 * - The submit button is identified as "submit".
 */
type FocusIdentity = string

const identifyFocused = ($el: JQuery<HTMLElement>): FocusIdentity => {
    if ($el.attr("role") === "select-field") {
        return $el.prev("label").attr("for") ?? "unknown-select-field"
    }

    const name = $el.attr("name")
    if (name) return name

    if ($el.attr("type") === "submit") return "submit"

    const selectFieldAncestor = $el.closest("[role='select-field']")
    if (selectFieldAncestor.length) {
        const fieldName = selectFieldAncestor.prev("label").attr("for") ?? "unknown-select-field"
        return `${fieldName}:clear`
    }

    // DatePicker's trigger Button (and its own conditional clear Button) sit one DOM level
    // below the field's <label> (see DatePicker.tsx: label -> div.relative.w-full -> Button[s]).
    const parent = $el.parent()
    const parentLabel = parent.prev("label")
    if (parentLabel.length) {
        const fieldName = parentLabel.attr("for") ?? "unknown-field"
        const isFirstButtonChild = $el.is(parent.children("button").first())
        return isFirstButtonChild ? fieldName : `${fieldName}:clear`
    }

    return $el.attr("role") ?? $el.prop("tagName")?.toLowerCase() ?? "unknown"
}

/** Safety cap on the number of Tab presses when walking to the form's natural terminus. */
const MAX_TAB_STEPS = 20

/**
 * Presses Tab repeatedly starting from whatever currently has focus, recording a stable identity
 * after each press, until the submit button is reached (the form's natural terminus) or the step
 * cap is hit.
 */
const walkForwardToSubmit = (): Cypress.Chainable<FocusIdentity[]> => {
    const path: FocusIdentity[] = []

    const step = (remaining: number): Cypress.Chainable<FocusIdentity[]> => {
        if (remaining <= 0) return cy.wrap(path)
        return cy.realPress("Tab")
            .then(() => cy.focused())
            .then($el => {
                const entry = identifyFocused($el)
                path.push(entry)
                if (entry === "submit") return cy.wrap(path)
                return step(remaining - 1)
            })
    }

    return step(MAX_TAB_STEPS)
}

/** Presses Shift+Tab the given number of times, recording a stable identity after each press. */
const walkBackward = (steps: number): Cypress.Chainable<FocusIdentity[]> => {
    const path: FocusIdentity[] = []

    const step = (remaining: number): Cypress.Chainable<FocusIdentity[]> => {
        if (remaining <= 0) return cy.wrap(path)
        return cy.realPress(["Shift", "Tab"])
            .then(() => cy.focused())
            .then($el => {
                path.push(identifyFocused($el))
                return step(remaining - 1)
            })
    }

    return step(steps)
}

describe("Transaction form keyboard navigation", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/transactions/new")
        })
    })

    it("reaches the Account select trigger via a real Tab key press and opens its popover on Enter", () => {
        // The Account select trigger is the DOM sibling immediately preceding the Name input
        // (see TransactionForm.tsx field order), so real Shift+Tab presses from Name are the
        // adjacent way to prove it is back in the native tab order. The standard test household
        // has exactly one account, so TransactionForm.tsx pre-fills the Account field, which
        // renders its own clear ("X") button — a real, always-focusable <button> that is a
        // conditional but genuine tab stop between the trigger and Name. Two Shift+Tab presses
        // walk: Name -> clear button -> trigger.
        cy.get("label[for='accountId']").next("[role='select-field']").as("accountTrigger")

        cy.get("input[name='name']").focus()
        cy.realPress(["Shift", "Tab"])
        cy.realPress(["Shift", "Tab"])

        cy.get("@accountTrigger").should("have.focus")

        cy.realPress("Enter")
        cy.get("div[role='dialog']").should("be.visible")
    })

    it("visits every date and select field anchor in relative forward order, and Shift+Tab retraces the exact reverse", () => {
        // Anchors required by D-04/D-05/D-06 (UI-SPEC "Interaction Order Contract"): every date
        // and select field must be reachable, in visual/DOM order, with no skip. Conditional tab
        // stops (Account's and Value Date's clear buttons, both pre-filled with default values in
        // this seeded scenario) are absorbed automatically by recording the observed path rather
        // than a hard-coded element list (planner_assumptions #3).
        const anchors: FocusIdentity[] = [
            "accountId", "name", "valueDate", "type", "amount",
            "description", "categoryId", "counterpartyId", "tagIds"
        ]

        cy.get("label[for='accountId']").next("[role='select-field']").focus()

        let forwardPath: FocusIdentity[] = []
        cy.focused().then($el => {
            forwardPath = [identifyFocused($el)]
        })

        cy.then(() => walkForwardToSubmit()).then(restOfPath => {
            forwardPath = forwardPath.concat(restOfPath)

            expect(forwardPath[forwardPath.length - 1], `recorded forward path: ${JSON.stringify(forwardPath)}`)
                .to.equal("submit")

            // Anchor assertion: each of the nine anchors appears exactly once, in relative order.
            const anchorPositions = anchors.map(anchor => {
                const indices = forwardPath.reduce<number[]>(
                    (acc, entry, idx) => entry === anchor ? [...acc, idx] : acc, []
                )
                expect(indices, `expected exactly one "${anchor}" stop in forward path: ${JSON.stringify(forwardPath)}`)
                    .to.have.length(1)
                return indices[0]
            })
            for (let i = 1; i < anchorPositions.length; i++) {
                expect(anchorPositions[i], `"${anchors[i]}" should follow "${anchors[i - 1]}" in the forward path`)
                    .to.be.greaterThan(anchorPositions[i - 1])
            }

            // Exact-reverse assertion (D-06): Shift+Tab the same number of times retraces the
            // observed forward path element-for-element, not merely "no trap".
            const forwardPressCount = forwardPath.length - 1 // path[0] was reached via .focus(), not a key press
            cy.then(() => walkBackward(forwardPressCount)).then(backwardRest => {
                const backwardPath = [forwardPath[forwardPath.length - 1]].concat(backwardRest)
                const expectedReverse = [...forwardPath].reverse()
                expect(backwardPath, "Shift+Tab path should be the exact reverse of the forward path")
                    .to.deep.equal(expectedReverse)
            })
        })
    })

    describe("select trigger keyboard operability (UI-SPEC consideration 3)", () => {
        const selectTriggers = ["accountId", "type", "categoryId", "counterpartyId", "tagIds"]
        const activationKeys = ["Enter", "Space", "ArrowDown"] as const

        selectTriggers.forEach(forAttr => {
            activationKeys.forEach(key => {
                it(`opens the "${forAttr}" select popover on ${key}`, () => {
                    cy.get(`label[for='${forAttr}']`).next("[role='select-field']").focus()
                    cy.realPress(key)
                    cy.get("div[role='dialog']").should("be.visible")
                    cy.realPress("Escape")
                    cy.get("div[role='dialog']").should("not.exist")
                })
            })
        })
    })

    it("keeps the Value Date trigger's click-to-open calendar behaviour unchanged by the fix (UI-SPEC consideration 5)", () => {
        // The Value Date trigger wraps a real <Button> (DatePicker.tsx), architecturally
        // different from the SelectField fix's target; this fix must not have disturbed it.
        cy.get("label[for='valueDate']").next().find("button").first().click()
        cy.get("div[role='dialog']").should("be.visible")
    })

    it("does not disturb search inputs elsewhere that use InputGroup (UI-SPEC consideration 6)", () => {
        // TableToolbar.tsx's search InputGroup must remain unaffected: the fix is scoped to the
        // specific InputGroup instance rendered inside SelectField.tsx, not InputGroup's shared
        // defaults, so a plain search input's wrapper must never itself become a tab stop.
        cy.visit("/transactions")

        cy.get("input[placeholder='Search transactions']").as("searchInput")
        cy.get("@searchInput").parent("[data-slot='input-group']").as("searchWrapper")

        cy.get("@searchWrapper").should("not.have.attr", "tabindex")

        cy.get("@searchInput").focus()
        cy.get("@searchInput").should("have.focus")
        cy.get("@searchWrapper").should("not.have.focus")
    })
})
