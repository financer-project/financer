import { TestData } from "@/test/utility/TestUtility"

describe("Counterparties", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/counterparties']").click()
        })
    })

    it.only("should be able to create a new counterparty and delete it afterwards", () => {
        cy.get("a[href='/counterparties/new']").click()

        cy.get("input[name='name']").type("Test Shop")
        cy.selectField({ for: "type", value: "Merchant" })
        cy.get("input[name='description']").type("My test shop")
        cy.get("input[name='accountName']").type("Shop Account")
        cy.get("input[name='webAddress']").type("https://testshop.com")
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/counterparties?")
        cy.reload()
        cy.wait(500)
        cy.get("td").contains("Test Shop").should("exist")
        cy.get("td").contains("Test Shop").click()

        // Verify counterparty details
        cy.component("dataItem").should("contain.text", "Test Shop")
        cy.component("dataItem").should("contain.text", "Merchant")
        cy.component("dataItem").should("contain.text", "My test shop")
        cy.component("dataItem").should("contain.text", "Shop Account")
        cy.component("dataItem").should("contain.text", "https://testshop.com")

        // Delete the counterparty
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()

        cy.url().should("include", "/counterparties?")
        cy.get("td").contains("Test Shop").should("not.exist")
    })

    it("should be able to edit a counterparty", () => {
        // First create a counterparty
        cy.get("a[href='/counterparties/new']").click()
        cy.get("input[name='name']").type("Old Company")
        cy.selectField({ for: "type", value: "Employer" })
        cy.get("input[name='description']").type("Old employer")
        cy.get("button[type='submit']").click()

        // Now edit the counterparty
        cy.get("td").contains("Old Company").click()
        cy.get("a").contains("Edit").click()

        cy.get("input[name='name']").clear().type("New Company")
        cy.selectField({ for: "type", value: "Service provider" })
        cy.get("input[name='description']").clear().type("New service provider")
        cy.get("input[name='accountName']").type("Service Account")
        cy.get("input[name='webAddress']").type("https://newcompany.com")
        cy.get("button[type='submit']").click()

        // Verify the changes
        cy.url().should("include", "/counterparties?")
        cy.reload()
        cy.get("td").contains("New Company").click()

        cy.component("dataItem").should("contain.text", "New Company")
        cy.component("dataItem").should("contain.text", "Service provider")
        cy.component("dataItem").should("contain.text", "New service provider")
        cy.component("dataItem").should("contain.text", "Service Account")
        cy.component("dataItem").should("contain.text", "https://newcompany.com")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
    })

    it("should display the list of seeded counterparties", () => {
        // Check that the seeded counterparties are displayed in the list
        cy.get("td").contains("Test Merchant").should("exist")
        cy.get("td").contains("Test Employer").should("exist")
        cy.get("td").contains("Test Utility").should("exist")
    })
})