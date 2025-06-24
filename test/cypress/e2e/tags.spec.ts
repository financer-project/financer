import { TestData } from "@/test/utility/TestUtility"

describe("Tags", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/tags']").click()
        })
    })

    it("should be able to create a new tag and delete it afterwards", () => {
        cy.get("a[href='/tags/new']").click()

        cy.get("input[name='name']").type("Shopping")
        cy.get("input[name='description']").type("Shopping expenses")
        cy.get("label[for='color'] + div").type("blue{enter}")
        cy.get("button[type='submit']").click()

        cy.url().should("satisfy", (str: string) => str.endsWith("/tags"))
        cy.wait(2000)
        cy.reload()
        cy.get("td").contains("Shopping").should("exist").click()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "Shopping")
        cy.get(":nth-child(2) > .text-md").should("contain.text", "Shopping expenses")
        cy.get(":nth-child(3) > .text-md").should("contain.text", "Blue")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
        cy.url().should("satisfy", (str: string) => str.endsWith("/tags"))
        cy.get("td").contains("Shopping").should("not.exist")
    })

    it("should be able to edit a tag", () => {
        // First create a tag
        cy.get("a[href='/tags/new']").click()
        cy.get("input[name='name']").type("Groceries")
        cy.get("input[name='description']").type("Grocery shopping")
        cy.get("label[for='color'] + div").type("green{enter}")
        cy.get("button[type='submit']").click()

        // Now edit the tag
        cy.get("td").contains("Groceries").should("exist").click()
        cy.get("a").contains("Edit").click()

        cy.get("input[name='name']").clear().type("Food")
        cy.get("input[name='description']").clear().type("Food expenses")
        cy.get("label[for='color'] + div").click()
        cy.get("div[role='option']").contains("Red").click()
        cy.get("button[type='submit']").click()

        // Verify the changes
        cy.url().should("satisfy", (str: string) => str.endsWith("/tags"))
        cy.reload()
        cy.get("td").contains("Food").should("exist").click()

        cy.get(":nth-child(1) > .text-md").should("contain.text", "Food")
        cy.get(":nth-child(2) > .text-md").should("contain.text", "Food expenses")
        cy.get(":nth-child(3) > .text-md").should("contain.text", "Red")

        // Clean up
        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").click()
    })
})