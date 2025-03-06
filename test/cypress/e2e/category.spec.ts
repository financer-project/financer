import { TestData } from "@/test/cypress/tasks/databaseTasks"

describe("Categories", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/categories']").click()
        })
    })

    it("should be able to create a new sub category and delete it afterwards", () => {
        cy.get("a[href='/categories/new?type=EXPENSE']").click()

        cy.get("label[for='parentId'] + div").type("living{enter}")
        cy.get("input[name='name']").type("Food")
        cy.get("label[for='color'] + div").type("orange{enter}")
        cy.get("button[type='submit']").click()

        cy.url().should("satisfy", (str: string) => str.endsWith("/categories"))
        cy.wait(1000)
        cy.get("ul li ul li")
            .should("have.text", "Food")
            .click()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "Food")
        cy.get(":nth-child(3) > .text-md").should("contain.text", "Orange")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
        cy.url().should("satisfy", (str: string) => str.endsWith("/categories"))
        cy.wait(1000)
        cy.get("ul li ul li").should("not.exist")
    })
})