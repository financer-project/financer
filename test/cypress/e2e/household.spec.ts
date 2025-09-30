import { TestData } from "@/test/utility/TestUtility"

describe("Households", () => {
    let testData: TestData

    const createNewHousehold = () => {
        cy.get("a[href='/households/new']").click()
        cy.get("input[name='name']").type("A New Household")
        cy.get("div[type='button']").click()
        cy.get("input[role='combobox']").type("Euro{enter}")
        cy.get("textarea[name='description']").type("My Household")
        cy.get("button[type='submit']").click()
    }

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
        createNewHousehold()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "A New Household")
        cy.get(":nth-child(2) > .text-md").should("contain.text", "Euro (EUR)")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()

        cy.get("tbody tr").should("have.length", 1)
    })

    it("should select the current household", () => {
        cy.get("button[data-sidebar='menu-button'] span").first().should("contain.text", testData.households.standard.name)
        cy.get("tbody tr:nth-child(1) td:nth-child(2) div").should("have.text", "Active")

        createNewHousehold()
        cy.get(":nth-child(1) > .text-md").should("contain.text", "A New Household")

        // navigate to /households
        cy.get("a[href='/households'][data-sidebar='menu-button']").click()
        cy.get("tbody tr:nth-child(1) td:nth-child(2) div").should("have.text", "Inactive")
        cy.get("tbody tr:nth-child(2) td:nth-child(2) div").should("have.text", "Active")
        cy.get("button[data-sidebar='menu-button'] span").first().click()

        // switch current household
        cy.get("div[role='menuitem']")
            .should("have.length", 2)
            .first().click()
        cy.get("a[href='/households'][data-sidebar='menu-button']").click()
        cy.get("tbody tr:nth-child(1) td:nth-child(2) div").should("have.text", "Active")
        cy.get("tbody tr:nth-child(2) td:nth-child(2) div").should("have.text", "Inactive")
    })
})
