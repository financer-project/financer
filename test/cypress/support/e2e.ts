import "./commands"
import { User } from "@prisma/client"
import { TestData } from "@/test/utility/TestUtility"
import "@cypress/code-coverage/support"
import Chainable = Cypress.Chainable

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            /**
             * Logs a user in.
             */
            loginWithUser(user: User): Chainable<void>

            resetAndSeedDatabase(callback: (testData: TestData) => void, resetUsers?: boolean): Chainable<void>

            resetDatabase(callback: () => void, resetUsers?: boolean): Chainable<void>

            /**
             * Provides access to custom selector commands
             */
            component<T extends keyof Selectors>(name: T, ...args: Parameters<Selectors[T]>): Chainable<JQuery>

            /**
             * Unified helper to interact with SelectField / SelectFormField components.
             *
             * Examples:
             *  - cy.selectField({ for: 'type', value: 'Income' })
             *  - cy.selectField({ label: 'Default Language', value: 'German' })
             *  - cy.selectField({ contains: 'Select date format', value: 'YYYY-MM-DD' })
             *  - cy.selectField({ for: 'tagIds', values: ['Work', 'Personal'] })
             */
            selectField(options: SelectFieldOptions): Chainable<void>

            /**
             * Read-only helper to target SelectField elements for assertions without interacting.
             *
             * Examples:
             *  - cy.findSelectField({ for: 'type' }).should('contain.text', 'Income')
             *  - cy.findSelectField({ label: 'Default Theme' }).should('contain.text', 'Dark')
             *  - cy.findSelectField({ contains: 'My Account' }).should('exist')
             */
            findSelectField(options: FindSelectFieldOptions): Chainable<JQuery>
        }
    }
}

export interface Selectors {
    dataItem(options?: {}): Chainable<JQuery>,

    select(options: { name: string }): Chainable<JQuery>,

    breadcrumb(options?: {}): Chainable<JQuery>
}

export interface SelectFieldOptions {
    /** Target the select by the "for" attribute of its label (usually the form field name) */
    for?: string
    /** Target by the label text (visible text within a <label> element) */
    label?: string
    /** Target by placeholder/visible text contained inside the select button */
    contains?: string

    /** Select a single option by its visible text label */
    value?: string
    /** Select multiple options (useful for multi-selects like tags). Each value is matched by visible text. */
    values?: string[]

    /** Provide a separate search text to type before confirming with Enter; defaults to the option text */
    search?: string
    /** Force a selection strategy: 'type' (type + enter) or 'click' (click list item). Default is auto-choose. */
    strategy?: "type" | "click" | "auto"
}

export interface FindSelectFieldOptions {
    /** Target the select by the "for" attribute of its label (usually the form field name) */
    for?: string
    /** Target by the label text (visible text within a <label> element) */
    label?: string
    /** Target by placeholder/visible text contained inside the select button */
    contains?: string
}

Cypress.on("uncaught:exception", (err) => {
    return !err.message.includes("DYNAMIC_SERVER_USAGE") && !err.message.includes("Minified React error #419")
})
