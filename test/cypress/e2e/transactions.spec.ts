import { TestData } from "@/test/utility/TestUtility"

describe("Transactions", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/transactions']").click()
        })
    })

    it("should be able to create a transaction and delete it", () => {
        cy.get("tbody tr").should("have.length", 2)

        cy.get("a[href='/transactions/new']").click()

        cy.get("label[for='accountId'] + div").type("My Account{enter}")
        cy.get("label[for='categoryId'] + div").type("Income{enter}")
        cy.get("input[name='name']").type("Salary")
        cy.get("label[for='type'] + div").type("Income{enter}")
        cy.get("input[name='amount']").type("100.00")
        cy.get("button[type='submit']").click()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "Salary")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
        cy.url().should("satisfy", (str: string) => str.endsWith("/transactions"))

        cy.get("tbody tr").should("have.length", 2)
    })

})
