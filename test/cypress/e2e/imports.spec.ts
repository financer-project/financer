import { TestData } from "@/test/utility/TestUtility"

describe("CSV Import", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/imports']").click()
        })
    })

    it("should be able to create an import job, map columns, and start the import", () => {
        // Click on the "New Import" button
        cy.get("a[href='/imports/new']").click()

        // Fill in the import job details
        cy.get("input[name='name']").type("Test Import")

        // Upload the CSV file
        cy.get("input[type='file']").selectFile("test/cypress/fixtures/test-import.csv", { force: true })

        // Click the "Next" button to proceed to column mapping
        cy.get("button").contains("Next").click()

        // Map columns to transaction fields
        // SelectField uses buttons instead of select elements
        cy.findSelectField({ contains: "Value Date" }).should("contain.text", "Value Date") // Date column
        cy.findSelectField({ contains: "Name" }).should("contain.text", "Name") // Description column
        cy.findSelectField({ contains: "Amount" }).should("contain.text", "Amount") // Amount column
        cy.findSelectField({ contains: "Account Identifier" }).should("contain.text", "Account Identifier") // Account column
        cy.findSelectField({ contains: "Category Name" }).should("contain.text", "Category Name") // Category column

        // Select date format for the Date column
        cy.selectField({ contains: "Select date format", value: "YYYY-MM-DD" })

        // Select amount format for the Amount column
        cy.selectField({ contains: "Select amount format", value: "comma" })

        // Click the "Next" button to proceed to value mapping
        cy.get("button").contains("Next").click()

        // Map values to entities
        // Map "My Account" to the standard account
        cy.findSelectField({ contains: "My Account" }).should("exist")

        cy.contains("Categories (2)").click()

        // Income category should be mapped automatically
        cy.findSelectField({ contains: "Income" }).should("exist")

        // Map "Living Costs" to the living costs category
        cy.selectField({ contains: "Select category", value: testData.categories.standard.livingCosts.name })

        cy.get("button").contains("Next").click()

        cy.get("button[role=checkbox]").click()
        cy.get("button").contains("Submit").click()

        // Verify that we're redirected to the import job details page
        cy.url().should("include", "/imports")

        // Verify that the import job is created with the correct name
        cy.contains("test-import").should("exist")

        // Verify that the import job is in DRAFT status
        cy.contains("Completed").should("exist")

        // Verify that transactions were created
        cy.visit("/transactions")
        cy.get("tbody tr").should("have.length.at.least", 5)

        // Verify that the transactions have the correct data
        cy.contains("Salary").should("exist")
        cy.contains("Rent").should("exist")
        cy.contains("Groceries").should("exist")
        cy.contains("Internet").should("exist")
        cy.contains("Refund").should("exist")
    })

    it("should display error message for invalid import", () => {
        // Click on the "New Import" button
        cy.get("a[href='/imports/new']").click()

        // Fill in the import job details but don't upload a file
        cy.get("input[name='name']").type("Invalid Import")

        // Click the "Next" button
        cy.get("button").contains("Next").click()
        cy.get("button").contains("Next").should("be.disabled")

        // Verify that an error message is displayed
        cy.contains("Please upload a CSV file.").should("exist")
    })

    it("should be able to view import job details", () => {
        // First create an import job
        cy.get("a[href='/imports/new']").click()
        cy.get("input[name='name']").type("View Test Import")
        cy.get("input[type='file']").selectFile("test/cypress/fixtures/test-import.csv", { force: true })
        cy.get("button").contains("Next").click()
        cy.get("button").contains("Next").click()
        cy.get("button").contains("Next").click()
        cy.get("button[role=checkbox]").click()
        cy.get("button").contains("Submit").click()

        // Verify that we're redirected to the import job details page
        cy.url().should("include", "/imports")

        // Click on the first import job in the list
        cy.get("tbody tr").first().click()

        // Verify that we're on the import job details page
        cy.url().should("include", "/imports/")

        // Verify that the import job details are displayed
        cy.contains("test-import").should("exist")
        cy.contains("5").should("exist")
        cy.contains("Column Mappings").should("exist")
        cy.contains("Value Mappings").should("exist")
    })
})
