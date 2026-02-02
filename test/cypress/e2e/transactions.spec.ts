import { TestData } from "@/test/utility/TestUtility"

describe("Transactions", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("li a[href='/transactions']").click()
        })
    })

    it("should be able to create a transaction with tags and delete it", () => {
        cy.get("tbody tr").should("have.length", 2)

        cy.get("a[href='/transactions/new']").first().click()

        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Salary")
        cy.selectField({ for: "type", value: "Income" })
        cy.get("input[name='amount']").type("100.00")
        cy.selectField({ for: "categoryId", value: "Income" })
        cy.selectField({ for: "counterpartyId", value: "Test Employer" })

        // Select tags (multi select)
        cy.selectField({ for: "tagIds", values: ["Work", "Personal"] })

        cy.get("button[type='submit']").click()

        // Verify transaction details including tags and counterparty
        cy.component("dataItem").should("contain.text", "Salary")
        cy.get("div span").should("contain.text", "Work")
        cy.get("div span").should("contain.text", "Personal")
        cy.get("div").contains("Counterparty").next().should("contain.text", "Test Employer")

        // Edit the transaction to change tags
        cy.get("a").contains("Edit").click()
        cy.selectField({ for: "tagIds", values: ["Work"] }) // toggles selection (deselect Work)
        cy.get("button[type='submit']").click()

        // Verify updated tags
        cy.get("div span").should("not.contain.text", "Work")
        cy.get("div span").should("contain.text", "Personal")

        // Delete the transaction
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
        cy.wait(2000)
        cy.url().should("satisfy", (str: string) => str.includes("/transactions?"))

        cy.get("tbody tr").should("have.length", 2)
    })

    it("should be able to create a transaction without tags", () => {
        cy.get("a[href='/transactions/new']").first().click()

        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Bonus")
        cy.selectField({ for: "type", value: "Income" })
        cy.get("input[name='amount']").type("50.00")
        cy.selectField({ for: "categoryId", value: "Income" })
        cy.selectField({ for: "counterpartyId", value: "Test Merchant" })
        cy.get("button[type='submit']").click()

        cy.component("dataItem").should("contain.text", "Bonus")
        cy.get("div").contains("Counterparty").next().should("contain.text", "Test Merchant")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
    })

    it("should filter transactions by category (multi-select) and reset", () => {
        // Initially seeded with 2 transactions for standard user
        cy.get("tbody tr").should("have.length", 2)

        // Apply Category filter: Income -> expect only the Income transaction to remain
        cy.selectField({ contains: "Category", value: "Income" })
        cy.url().should("include", "categoryId=")
        cy.get("tbody tr").should("have.length", 1)
        cy.get("tbody tr td").first().should("contain.text", "Income")

        // Add second Category to multi-select: Cost of Living -> expect 2 rows again
        cy.selectField({ contains: "Category", value: "Cost of Living" })
        cy.get("tbody tr").should("have.length", 2)

        // Reset filters using toolbar button
        cy.contains("button", "Reset").click()
        cy.get("tbody tr").should("have.length", 2)
    })

    it("should create a new tag inline from the transaction form", () => {
        cy.get("a[href='/transactions/new']").first().click()

        // Fill in required fields
        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Test Transaction with New Tag")
        cy.selectField({ for: "type", value: "Expense" })
        cy.get("input[name='amount']").type("25.00")
        cy.selectField({ for: "categoryId", value: "Cost of Living" })

        // Open tags dropdown and click "Create new tag..."
        cy.get("label[for='tagIds']").next("[role='select-field']").click()
        cy.get("div[role='dialog']").should("be.visible")
        cy.get("div[role='listbox']").contains("Create new tag...").click()

        // Dialog should open for creating a new tag
        cy.get("div[role='dialog']").should("contain.text", "Create New Tag")

        // Fill in the tag form
        cy.get("div[role='dialog'] input[name='name']").type("New Inline Tag")

        // Submit the tag form
        cy.get("div[role='dialog'] button[type='submit']").click()

        // Dialog should close and the new tag should be selected
        cy.get("div[role='dialog']").contains("Create New Tag").should("not.exist")
        cy.findSelectField({ for: "tagIds" }).should("contain.text", "New Inline Tag")

        // Submit the transaction
        cy.get("button[type='submit']").click()

        // Verify the transaction was created with the new tag
        cy.component("dataItem").should("contain.text", "Test Transaction with New Tag")
        cy.get("div span").should("contain.text", "New Inline Tag")

        // Clean up - delete the transaction
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
    })

    it("should create a new counterparty inline from the transaction form", () => {
        cy.get("a[href='/transactions/new']").first().click()

        // Fill in required fields
        cy.findSelectField({ contains: "My Account" }).should("exist")
        cy.get("input[name='name']").type("Test Transaction with New Counterparty")
        cy.selectField({ for: "type", value: "Income" })
        cy.get("input[name='amount']").type("150.00")
        cy.selectField({ for: "categoryId", value: "Income" })

        // Open counterparty dropdown and click "Create new counterparty..."
        cy.get("label[for='counterpartyId']").next("[role='select-field']").click()
        cy.get("div[role='dialog']").should("be.visible")
        cy.get("div[role='listbox']").contains("Create new counterparty...").click()

        // Dialog should open for creating a new counterparty
        cy.get("div[role='dialog']").should("contain.text", "Create New Counterparty")

        // Fill in the counterparty form
        cy.get("div[role='dialog'] input[name='name']").type("New Inline Counterparty")
        // Select a type (required field)
        cy.get("div[role='dialog'] label[for='type']").next("[role='select-field']").click()
        cy.get("div[role='listbox']").contains("Company").click()

        // Submit the counterparty form
        cy.get("div[role='dialog'] button[type='submit']").click()

        // Dialog should close and the new counterparty should be selected
        cy.get("div[role='dialog']").contains("Create New Counterparty").should("not.exist")
        cy.findSelectField({ for: "counterpartyId" }).should("contain.text", "New Inline Counterparty")

        // Submit the transaction
        cy.get("button[type='submit']").click()

        // Verify the transaction was created with the new counterparty
        cy.component("dataItem").should("contain.text", "Test Transaction with New Counterparty")
        cy.get("div").contains("Counterparty").next().should("contain.text", "New Inline Counterparty")

        // Clean up - delete the transaction
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
    })

    it("should allow canceling the create tag dialog without affecting the form", () => {
        cy.get("a[href='/transactions/new']").first().click()

        // Select an existing tag first
        cy.selectField({ for: "tagIds", values: ["Work"] })
        cy.findSelectField({ for: "tagIds" }).should("contain.text", "Work")

        // Open tags dropdown and click "Create new tag..."
        cy.get("label[for='tagIds']").next("[role='select-field']").click()
        cy.get("div[role='dialog']").should("be.visible")
        cy.get("div[role='listbox']").contains("Create new tag...").click()

        // Dialog should open
        cy.get("div[role='dialog']").should("contain.text", "Create New Tag")

        // Close the dialog without submitting (click the close button)
        cy.get("div[role='dialog'] button[class*='absolute']").click()

        // The previously selected tag should still be there
        cy.findSelectField({ for: "tagIds" }).should("contain.text", "Work")
    })
})
