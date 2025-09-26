import { User } from "@prisma/client"
import { TestData } from "@/test/utility/TestUtility"

Cypress.Commands.add("loginWithUser", (user: User) => {
    cy.session(user.email, () => {
        cy.visit("/login")
        cy.get("input[name='email']").type(user.email)
        cy.get("input[name='password']").type("password")
        cy.get("button[type='submit']").click()
        cy.url().should("include", "/dashboard")
    }, {
        validate() {
            cy.getCookie("app-dir_sSessionToken").should("exist")
            cy.getCookie("app-dir_sAnonymousSessionToken").should("not.exist")
            cy.visit("/")
            cy.url().should("include", "/dashboard")
        },
        cacheAcrossSpecs: true
    })
})

Cypress.Commands.add("resetAndSeedDatabase", (callback, resetUsers) => {
    cy.task("resetDatabase", resetUsers)
    cy.task("seedDatabase").then((result) => {
        callback(result as TestData)
    })
})


Cypress.Commands.add("resetDatabase", (callback, resetUsers) => {
    cy.task("resetDatabase", resetUsers).then(() => callback())
})