describe("Authentication Spec", () => {
    beforeEach(() => {
        cy.resetAndSeedDatabase(() => {
            cy.visit("/")
        }, true)
    })

    after(() => {
        cy.task("resetDatabase", true)
    })

    it("Create a new user", () => {
        cy.get("a[href='/signup']").click()

        cy.get("input[name='firstName']").type("Cypress")
        cy.get("input[name='lastName']").type("Test")
        cy.get("input[name='email']").type("cypress2@test.com")
        cy.get("input[name='password']").type("password123")
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/onboarding")

        cy.get("input[name='name']").type("A New Household")
        cy.get("div[type='button']").click()
        cy.get("input[role='combobox']").type("Euro{enter}")
        cy.get("textarea[name='description']").type("My Household")
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/households/")
    })

    it("Login with existing user", () => {
        cy.get("a[href='/login']").click()

        cy.get("input[name='email']").type("user@financer.com")
        cy.get("input[name='password']").type("password")
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/dashboard")
        cy.get("div").contains("Dashboard").should("exist")
    })
})