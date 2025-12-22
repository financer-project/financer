import { TestData } from "@/test/utility/TestUtility"

describe("Mobile Tests", () => {
    let testData: TestData

    beforeEach(() => {
        // Set mobile viewport
        cy.viewport(375, 667) // iPhone SE dimensions

        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
        })
    })

    it("should authenticate user and redirect to dashboard on mobile", () => {
        // Verify we're logged in and on dashboard
        cy.url().should("include", "/dashboard")
        cy.get("li").contains("Dashboard").should("exist")
    })

    it("should navigate using sidebar by pressing trigger button", () => {
        // Click the sidebar trigger button to open mobile sidebar
        cy.get("button[data-sidebar='trigger']").click()

        // Wait for sidebar to open and verify it's visible
        cy.get("div[data-sidebar='sidebar']").should("be.visible")

        // Navigate to Transactions via sidebar
        cy.get("li a[href='/transactions']").click()

        // Verify navigation worked
        cy.url().should("include", "/transactions")
        cy.get(".bg-card").should("have.length", 2) // Should have seeded transactions
    })

    it("should create transaction and show it in list on mobile", () => {
        // Navigate to transactions page first
        cy.get("button[data-sidebar='trigger']").click()
        cy.get("li a[href='/transactions']").click()

        // Verify we're on transactions page
        cy.url().should("include", "/transactions")
        cy.get(".text-lg").should("have.length", 2)

        // Navigate to create transaction
        cy.get("a[href='/transactions/new']").first().click()
        cy.url().should("include", "/transactions/new")

        // Fill transaction form
        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Mobile Test Transaction")
        cy.selectField({ for: "type", value: "Income" })
        cy.get("input[name='amount']").type("250.00")
        cy.selectField({ for: "categoryId", value: "Income" })

        // Submit the form
        cy.get("button[type='submit']").click()

        // Verify transaction was created
        cy.component("dataItem").should("contain.text", "Mobile Test Transaction")

        // Navigate back to transactions list
        cy.get("button[data-sidebar='trigger']").click()
        cy.get("li[data-sidebar='menu-item'] a[href='/transactions']").click()
        cy.get("div.text-lg").should("have.length", 3)

        // Navigate to details
        cy.get("div.text-lg").contains("Mobile Test Transaction").click()
        cy.url().should("include", "/transactions/")
        cy.component("breadcrumb").should("contain.text", "Mobile Test Transaction", { timeout: 10000 })
        cy.component("dataItem").should("contain.text", "Mobile Test Transaction")

        // Clean up - delete the transaction
        cy.get("button.bg-destructive").click()
        cy.get("button.bg-primary").contains("Confirm").click()

        // Verify deletion
        cy.url().should("include", "/transactions?")
        cy.reload()
        cy.get("div.text-lg").should("have.length", 2)
    })
})