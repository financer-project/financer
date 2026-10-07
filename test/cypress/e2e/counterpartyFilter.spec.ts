import { TestData } from "@/test/utility/TestUtility"

describe("Transaction List filters (#78 regression)", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("li a[href='/transactions']").click()
        })
    })

    it("should filter transactions by counterparty (multi-select) and reset", () => {
        // Fail the test on any uncaught page error: filtering must never throw.
        cy.on("uncaught:exception", (err) => {
            throw new Error(`UNCAUGHT EXCEPTION (counterparty filter): ${err.message}\n${err.stack}`)
        })

        // Initially seeded with 2 transactions for the standard user.
        cy.get("tbody tr").should("have.length", 2)

        // Create a transaction linked to "Test Merchant" so the filter has a row to find.
        cy.get("a[href='/transactions/new']").first().click()
        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Coffee")
        cy.selectField({ for: "type", value: "Expense" })
        cy.get("input[name='amount']").type("5.00")
        cy.selectField({ for: "categoryId", value: "Cost of Living" })
        cy.selectField({ for: "counterpartyId", value: "Test Merchant" })
        cy.get("button[type='submit']").click()
        cy.component("dataItem").should("contain.text", "Coffee")

        // Back to the transaction list.
        cy.get("li a[href='/transactions']").click()
        cy.get("tbody tr").should("have.length", 3)

        // Apply Counterparty filter: "Test Merchant" -> only the Coffee transaction remains.
        cy.selectField({ contains: "Counterparty", value: "Test Merchant" })
        cy.url().should("include", "counterpartyId=")
        cy.get("tbody tr").should("have.length", 1)
        cy.get("tbody tr td").first().should("contain.text", "Coffee")

        // Add a second counterparty ("Test Employer", no transactions) to the multi-select: union is unchanged.
        cy.selectField({ contains: "Counterparty", value: "Test Employer" })
        cy.get("tbody tr").should("have.length", 1)

        // Reset filters using the toolbar button -> restore all 3 rows.
        cy.contains("button", "Reset").click()
        cy.get("tbody tr").should("have.length", 3)
    })

    it("should filter transactions by tag without throwing", () => {
        cy.on("uncaught:exception", (err) => {
            throw new Error(`UNCAUGHT EXCEPTION (tag filter): ${err.message}\n${err.stack}`)
        })

        cy.get("tbody tr").should("have.length", 2)

        // Apply Tag filter: "Work". Seeded transactions have no tags -> empty result is valid.
        cy.selectField({ contains: "Tag", value: "Work" })
        cy.url().should("include", "tagId=")
        cy.get("tbody tr").should("have.length", 0)

        // Reset restores the 2 rows.
        cy.contains("button", "Reset").click()
        cy.get("tbody tr").should("have.length", 2)
    })
})
