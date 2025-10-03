import { TestData } from "@/test/utility/TestUtility"

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
        cy.get("button[role=select-field]").eq(3).should("contain.text", "Teal")
        cy.get("button[type='submit']").click()

        cy.url().should("satisfy", (str: string) => str.endsWith("/categories"))
        cy.wait(2000)
        cy.reload()
        cy.get("span").contains("Food").should("exist").click()

        cy.component("dataItem").should("contain.text", "Food")
        cy.component("dataItem").should("contain.text", "Teal")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()
        cy.url().should("satisfy", (str: string) => str.endsWith("/categories"))
        cy.wait(1000)
        cy.get("span").contains("Food").should("not.exist")
    })
})
