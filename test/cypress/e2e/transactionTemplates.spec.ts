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
        cy.get("td").contains("Monthly Rent").should("not.exist")
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
