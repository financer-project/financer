import { User } from "@prisma/client"
import { TestData } from "@/test/utility/TestUtility"
import { FindSelectFieldOptions, SelectFieldOptions, Selectors } from "@/test/cypress/support/e2e"

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

Cypress.Commands.add("component", (name, ...args) => {
    const selectors: Selectors = {
        dataItem: () => {
            return cy.get("label + span.text-sm")
        },
        select(options: { name: string }): Cypress.Chainable<JQuery> {
            return cy.get(`label[for="${options.name}"] + div`)
        },
        breadcrumb() {
            return cy.get("li span[role='link'], li a")
        }
    }

    console.log(args)
    return selectors[name](args[0] as any) // eslint-disable-line @typescript-eslint/no-explicit-any
})


// Unified helper to interact with SelectField / SelectFormField components
Cypress.Commands.add("selectField", (opts) => {
    const options: Required<Pick<SelectFieldOptions, "strategy">> & SelectFieldOptions = {
        strategy: opts.strategy ?? "auto",
        ...opts
    }

    const getTarget = () => {
        if (options.for) {
            // Target by label's htmlFor attribute
            return cy.get(`label[for='${options.for}']`).next("[role='select-field']")
                .then($el => $el.length ? cy.wrap($el) : cy.get(`label[for='${options.for}'] + div[role='select-field']`))
        }
        if (options.label) {
            return cy.contains("label", options.label).next("[role='select-field']")
        }
        if (options.contains) {
            return cy.get("div[role='select-field']").contains(options.contains).closest("div[role='select-field']")
        }
        throw new Error("selectField: No target specified. Provide one of: for, label, contains.")
    }

    const ensureOpen = () => {
        // After opening, we expect a listbox/dialog with options to be visible
        return cy.get("div[role='listbox'], div[role='dialog']").should("be.visible")
    }

    const ensureClosed = () => {
        return cy.get("div[role='listbox'], div[role='dialog']").should("not.exist")
    }

    const selectByTyping = (text: string) => {
        // Try to type into the CommandInput (search input). It has placeholder "Search ..."
        cy.get("input[placeholder='Search ...']").should("be.visible")
        return cy.get("input[placeholder='Search ...']").type(`${text}{enter}`)
    }

    const selectByClicking = (text: string) => {
        // Click the option by visible text within the list area
        return cy.get("div[role='listbox'], div[role='dialog']")
            .contains(text)
            .click()
    }

    const doSingle = (value: string) => {
        if (options.strategy === "type") {
            return selectByTyping(options.search ?? value)
        }
        if (options.strategy === "click") {
            return selectByClicking(value)
        }
        // auto: prefer typing if the search input exists; otherwise click
        return cy.get("body").then($body => {
            const hasSearch = $body.find("input[placeholder='Search ...']").length > 0
            if (hasSearch) {
                return selectByTyping(options.search ?? value)
            } else {
                return selectByClicking(value)
            }
        })
    }

    const doMultiple = (values: string[]) => {
        // For multiple, the popover stays open by default; iterate values sequentially
        if (options.strategy === "type") {
            return cy.wrap(values).each((v: string) => {
                return selectByTyping(options.search ?? v)
            })
        }
        if (options.strategy === "click") {
            return cy.wrap(values).each((v: string) => {
                return selectByClicking(v)
            })
        }
        // auto: for each value, prefer typing if input exists; otherwise click
        return cy.wrap(values).each((v: string) => {
            return cy.get("body").then($body => {
                const hasSearch = $body.find("input[placeholder='Search ...']").length > 0
                if (hasSearch) {
                    return selectByTyping(options.search ?? v)
                } else {
                    return selectByClicking(v)
                }
            })
        })
    }

    getTarget()
        .click()
        .then(() => ensureOpen())
        .then(() => {
            if (options.values?.length) {
                return doMultiple(options.values)
            }
            if (options.value) {
                return doSingle(options.value)
            }
            if (options.search) {
                // Only a search provided; type and press enter
                return selectByTyping(options.search)
            }
            throw new Error("selectField: Provide either 'value', 'values', or 'search' to select.")
        })
        .then(() => {
            cy.get("body").type("{esc}")
            ensureClosed()
        })
})

// Read-only helper to locate a SelectField for assertions
Cypress.Commands.add("findSelectField", (opts: FindSelectFieldOptions) => {
    const options = opts

    const getTarget = () => {
        if (options.for) {
            // Target by label's htmlFor attribute
            return cy.get(`label[for='${options.for}']`).next("[role='select-field']")
                .then($el => $el.length ? cy.wrap($el) : cy.get(`label[for='${options.for}'] + div[role='select-field']`))
        }
        if (options.label) {
            return cy.contains("label", options.label).next("[role='select-field']")
        }
        if (options.contains) {
            return cy.get("div[role='select-field']").contains(options.contains).closest("div[role='select-field']")
        }
        throw new Error("findSelectField: No target specified. Provide one of: for, label, contains.")
    }

    return getTarget()
})