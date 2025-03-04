import "./commands"
import { User } from "@prisma/client"
import { TestData } from "@/test/cypress/tasks/databaseTasks"

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            /**
             * Logs a user in.
             */
            loginWithUser(user: User): Chainable<void>

            resetAndSeedDatabase(callback: (testData: TestData) => void, resetUsers?: boolean): Chainable<void>
        }
    }
}

Cypress.on("uncaught:exception", (err) => {
    return !err.message.includes("DYNAMIC_SERVER_USAGE") && !err.message.includes("Minified React error #419")
})