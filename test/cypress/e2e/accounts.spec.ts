import { TestData } from "@/test/utility/TestUtility"

describe("Accounts", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/households']").click()
        })
    })

    it("should display an own account", () => {
        cy.get("tbody tr:first-child").click()
        cy.url().should("include", `/households/${testData.households.standard.id}`)

        cy.get("tbody tr").should("have.length", 1)
        cy.get("tbody tr:first-child").scrollIntoView()
        cy.get("tbody tr:first-child").click()

        cy.component("dataItem").should("contain.text", "My Account")
    })

    it("should be able to create a new account and delete it", () => {
        cy.get("tbody tr:first-child").click()
        cy.url().should("include", `/households/${testData.households.standard.id}`)

        cy.get("tbody tr").should("have.length", 1)

        cy.get(`a[href='/households/${testData.households.standard.id}/accounts/new']`).click()
        cy.url().should("include", `/households/${testData.households.standard.id}/accounts/new`)

        cy.get("input[name='name']").type("A New Account")
        cy.get("input[name='technicalIdentifier']").type("DE11 0000 0000 0000 0000 01")
        cy.get("button[type='submit']").click()

        cy.component("dataItem").should("contain.text", "A New Account")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()

        cy.url().should("include", `/households/${testData.households.standard.id}`)
        cy.get("tbody tr").scrollIntoView()
        cy.get("tbody tr").should("have.length", 1)
    })
})
