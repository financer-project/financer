import { TestData } from "@/test/cypress/tasks/databaseTasks"

describe("Households", () => {

    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/households']").click()
        })
    })

    it("should display an own household", () => {
        cy.get("tbody tr").should("have.length", 1)
        cy.get("tbody tr:first-child").click()
        cy.url().should("include", `/households/${testData.households.standard.id}`)
    })

    it("should not display households of other users", () => {
        cy.visit(`/households/${testData.households.admin.id}`)
    })

    it("should create a household and delete", () => {
        cy.get("a[href='/households/new']").click()
        cy.get("input[name='name']").type("A New Household")
        cy.get("div[type='button']").click()
        cy.get("input[role='combobox']").type("Euro{enter}")
        cy.get("textarea[name='description']").type("My Household")
        cy.get("button[type='submit']").click()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "A New Household")
        cy.get(":nth-child(2) > .text-md").should("contain.text", "Euro (EUR)")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()

        cy.get("tbody tr").should("have.length", 1)
    })

})