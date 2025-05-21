describe("Authentication Spec", () => {
    beforeEach(() => {
        cy.resetAndSeedDatabase(()=> {
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

        cy.url().should("include", "/dashboard")
    })

    it("Login with existing user", () => {
        cy.get("a[href='/login']").click()

        cy.get("input[name='email']").type("user@financer.com")
        cy.get("input[name='password']").type("password")
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/dashboard")
    })
})