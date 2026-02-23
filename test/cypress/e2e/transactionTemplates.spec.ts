import { TestData } from "@/test/utility/TestUtility"

describe("Transaction Templates", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/transaction-templates")
        })
    })

    // Helper: expand the collapsed "Suggested Templates" section
    function expandSuggestionsSection() {
        cy.get("#suggested-templates").contains("Suggested Templates").click()
    }

    it("should be able to create a new template and delete it", () => {
        cy.get("a[href='/transaction-templates/new']").click()

        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Monthly Rent")
        cy.selectField({ for: "type", value: "Expense" })
        cy.get("input[name='amount']").type("1000")
        cy.selectField({ for: "frequency", value: "Monthly" })

        cy.get("button[type='submit']").click()

        // Should redirect to template detail page
        cy.url().should("match", /\/transaction-templates\/[^/]+$/)
        cy.component("dataItem").should("contain.text", "Monthly Rent")
        cy.component("dataItem").should("contain.text", "EXPENSE")
        cy.component("dataItem").should("contain.text", "Monthly")

        // Delete the template
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()

        cy.url().should("include", "/transaction-templates")
        cy.contains("Monthly Rent").should("not.exist")
    })

    it("should be able to edit a template", () => {
        // Create a template first
        cy.get("a[href='/transaction-templates/new']").click()

        cy.get("input[name='name']").type("Weekly Groceries")
        cy.selectField({ for: "type", value: "Expense" })
        cy.get("input[name='amount']").type("150")
        cy.selectField({ for: "frequency", value: "Weekly" })
        cy.get("button[type='submit']").click()

        cy.url().should("match", /\/transaction-templates\/[^/]+$/)

        // Edit the template
        cy.get("a").contains("Edit").click()

        cy.get("input[name='name']").clear().type("Weekly Groceries Updated")
        cy.get("input[name='amount']").clear().type("200")
        cy.get("button[type='submit']").click()

        // Verify updated details
        cy.component("dataItem").should("contain.text", "Weekly Groceries Updated")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
    })

    describe("suggestions", () => {
        beforeEach(() => {
            cy.resetAndSeedDatabase(result => {
                testData = result as TestData
                cy.seedRecurringTransactions({ name: "Monthly Subscription", amount: 15, type: "EXPENSE", count: 3 })
                cy.loginWithUser(testData.users.standard)
                cy.visit("/transaction-templates")
                cy.clearLocalStorage("financer-dismissed-suggestions")
            })
        })

        it("should show suggestions, pre-fill the form on create, and remove the suggestion afterwards", () => {
            // Section starts collapsed with count badge
            cy.get("#suggested-templates").contains("1").should("be.visible")

            // Expand and verify card content
            expandSuggestionsSection()
            cy.contains("Monthly Subscription")
                .closest("[data-slot='card']")
                .within(() => {
                    cy.contains("Monthly").should("be.visible")
                    cy.contains("3 occurrences").should("be.visible")
                })

            // Click Create Template — form should be pre-filled from URL params
            cy.contains("Monthly Subscription")
                .closest("[data-slot='card']")
                .contains("Create Template")
                .click()

            cy.url().should("include", "/transaction-templates/new")
            cy.get("input[name='name']").should("have.value", "Monthly Subscription")
            cy.findSelectField({ for: "frequency" }).should("contain.text", "Monthly")
            cy.get("button[type='submit']").click()
            cy.url().should("match", /\/transaction-templates\/[^/]+$/)

            // Suggestion should no longer appear after the template is created
            cy.visit("/transaction-templates")
            expandSuggestionsSection()
            cy.contains("Monthly Subscription").should("not.exist")
        })

        it("should allow dismissing a suggestion and resetting dismissed ones", () => {
            expandSuggestionsSection()
            cy.contains("Monthly Subscription").should("be.visible")

            // Dismiss — suggestion disappears, badge drops to 0, reset button appears
            cy.get("button[title='Dismiss suggestion']").click()
            cy.contains("Monthly Subscription").should("not.exist")
            cy.get("#suggested-templates").contains("0").should("be.visible")
            cy.get("#suggested-templates").contains("Show 1 dismissed").should("be.visible")

            // Reset — suggestion reappears, reset button disappears
            cy.get("#suggested-templates").contains("Show 1 dismissed").click()
            cy.contains("Monthly Subscription").should("be.visible")
            cy.get("#suggested-templates").contains("Show").should("not.exist")
        })
    })

    it("should be able to toggle template active status from detail page", () => {
        // Create a template
        cy.get("a[href='/transaction-templates/new']").click()

        cy.get("input[name='name']").type("Toggle Test Template")
        cy.selectField({ for: "type", value: "Income" })
        cy.get("input[name='amount']").type("500")
        cy.selectField({ for: "frequency", value: "Monthly" })
        cy.get("button[type='submit']").click()

        cy.url().should("match", /\/transaction-templates\/[^/]+$/)

        // Template should be active by default
        cy.contains("Active").should("exist")

        // Deactivate via the switch
        cy.get("#template-active").click()
        cy.contains("Inactive").should("exist")

        // Reactivate
        cy.get("#template-active").click()
        cy.contains("Active").should("exist")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
    })
})
