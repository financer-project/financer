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

        cy.get("a[href='/transactions/new']").click()

        cy.get("label[for='accountId'] + div").type("My Account{enter}")
        cy.get("label[for='categoryId'] + div").type("Income{enter}")
        cy.get("input[name='name']").type("Salary")
        cy.get("label[for='type'] + div").type("Income{enter}")
        cy.get("input[name='amount']").type("100.00")

        // Select tags
        cy.get("label[for='tagIds'] + div").click()
        cy.get("div[role='option']").contains("Work").click()
        cy.get("div[role='option']").contains("Personal").click()
        cy.get("body").click() // Close the dropdown

        cy.get("button[type='submit']").click()

        // Verify transaction details including tags
        cy.get(":nth-child(1) > .text-md").should("contain.text", "Salary")
        cy.get("div span").should("contain.text", "Work")
        cy.get("div span").should("contain.text", "Personal")

        // Edit the transaction to change tags
        cy.get("a").contains("Edit").click()
        cy.get("label[for='tagIds'] + div").click()
        cy.get("div[role='option']").contains("Work").click() // Deselect Work tag
        cy.get("body").click() // Close the dropdown
        cy.get("button[type='submit']").click()

        // Verify updated tags
        cy.get("div span").should("not.contain.text", "Work")
        cy.get("div span").should("contain.text", "Personal")

        // Delete the transaction
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
        cy.wait(2000)
        cy.url().should("satisfy", (str: string) => str.endsWith("/transactions"))

        cy.get("tbody tr").should("have.length", 2)
    })

    it("should be able to create a transaction without tags", () => {
        cy.get("a[href='/transactions/new']").click()

        cy.get("label[for='accountId'] + div").type("My Account{enter}")
        cy.get("label[for='categoryId'] + div").type("Income{enter}")
        cy.get("input[name='name']").type("Bonus")
        cy.get("label[for='type'] + div").type("Income{enter}")
        cy.get("input[name='amount']").type("50.00")
        cy.get("button[type='submit']").click()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "Bonus")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
    })
})
