import { TestData } from "@/test/utility/TestUtility"

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
})
