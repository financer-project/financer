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

    it("should be able to create a new counterparty and delete it afterwards", () => {
        cy.get("a[href='/counterparties/new']").click()

        cy.get("input[name='name']").type("Test Shop")
        cy.get("label[for='type'] + div").type("Merchant{enter}")
        cy.get("input[name='description']").type("My test shop")
        cy.get("input[name='accountName']").type("Shop Account")
        cy.get("input[name='webAddress']").type("https://testshop.com")
        cy.get("button[type='submit']").click()

        cy.url().should("satisfy", (str: string) => str.endsWith("/counterparties"))
        cy.wait(2000)
        cy.reload()
        cy.get("td").contains("Test Shop").should("exist").click()

        // Verify counterparty details
        cy.get("div").contains("Name").next().should("contain.text", "Test Shop")
        cy.get("div").contains("Type").next().should("contain.text", "Merchant")
        cy.get("div").contains("Description").next().should("contain.text", "My test shop")
        cy.get("div").contains("Account Name").next().should("contain.text", "Shop Account")
        cy.get("div").contains("Web Address").next().should("contain.text", "https://testshop.com")

        // Delete the counterparty
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
        cy.url().should("satisfy", (str: string) => str.endsWith("/counterparties"))
        cy.get("td").contains("Test Shop").should("not.exist")
    })

    it("should be able to edit a counterparty", () => {
        // First create a counterparty
        cy.get("a[href='/counterparties/new']").click()
        cy.get("input[name='name']").type("Old Company")
        cy.get("label[for='type'] + div").type("Employer{enter}")
        cy.get("input[name='description']").type("Old employer")
        cy.get("button[type='submit']").click()

        // Now edit the counterparty
        cy.get("td").contains("Old Company").should("exist").click()
        cy.get("a").contains("Edit").click()

        cy.get("input[name='name']").clear().type("New Company")
        cy.get("label[for='type'] + div").click()
        cy.get("div[role='option']").contains("Service provider").click()
        cy.get("input[name='description']").clear().type("New service provider")
        cy.get("input[name='accountName']").type("Service Account")
        cy.get("input[name='webAddress']").type("https://newcompany.com")
        cy.get("button[type='submit']").click()

        // Verify the changes
        cy.url().should("satisfy", (str: string) => str.endsWith("/counterparties"))
        cy.reload()
        cy.get("td").contains("New Company").should("exist").click()

        cy.get("div").contains("Name").next().should("contain.text", "New Company")
        cy.get("div").contains("Type").next().should("contain.text", "Service provider")
        cy.get("div").contains("Description").next().should("contain.text", "New service provider")
        cy.get("div").contains("Account Name").next().should("contain.text", "Service Account")
        cy.get("div").contains("Web Address").next().should("contain.text", "https://newcompany.com")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
    })

    it("should display the list of seeded counterparties", () => {
        // Check that the seeded counterparties are displayed in the list
        cy.get("td").contains("Test Merchant").should("exist")
        cy.get("td").contains("Test Employer").should("exist")
        cy.get("td").contains("Test Utility").should("exist")
    })
})