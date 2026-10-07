import { TestData } from "@/test/utility/TestUtility"

describe("Transaction form keyboard navigation (#76 regression)", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
        })
    })

    // Stable identity for a focused element, so tab order can be compared without guessing.
    const identity = ($el: JQuery<HTMLElement>): string => {
        const el = $el[0]
        if (!el) return "<none>"
        if (el.getAttribute("role") === "select-field") {
            const label = $el.prevAll("label").first()
            return `select:${label.attr("for") ?? "?"}`
        }
        if (el.getAttribute("name")) return `field:${el.getAttribute("name")}`
        if (el.tagName === "BUTTON") return `button:${$el.text().trim().replace(/\s+/g, " ").slice(0, 24)}`
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            return `field:${el.getAttribute("name") ?? el.tagName.toLowerCase()}`
        }
        return el.tagName.toLowerCase()
    }

    // Walk forward (or backward, with shift) pressing Tab, recording the identity of every
    // focused element. The walk stops before pressing Tab again once stopAt matches, so focus
    // never leaves the page (tabbing past the last control drops focus into the browser chrome,
    // where `cy.focused()` finds nothing). `steps` is only an upper bound for safety.
    const tabPath = (steps: number, shift = false, stopAt?: (id: string) => boolean) => {
        const path: string[] = []
        let chain: Cypress.Chainable<JQuery<HTMLElement>> = cy.focused()
            .then(($el) => { path.push(identity($el)); return $el })

        for (let i = 0; i < steps; i++) {
            chain = chain.then(($el) => {
                if (stopAt && stopAt(path[path.length - 1])) {
                    return cy.wrap($el)
                }
                if (shift) cy.realPress(["Shift", "Tab"])
                else cy.realPress("Tab")
                return cy.focused().then(($next) => { path.push(identity($next)); return $next })
            })
        }

        return chain.then(() => cy.wrap(path))
    }

    it("Tabs forward through every date and select field in visual order and Shift+Tabs back in exact reverse", () => {
        cy.visit("/transactions/new")

        // The Account select trigger is the first field in the form (its clear button is a
        // conditional extra stop because it carries a default value).
        cy.get("label[for='accountId']").next("[role='select-field']").focus()

        // The create form's submit button is the last control to walk up to.
        const isSubmit = (id: string) => id.startsWith("button:Create Transaction")

        // Walk forward, recording the observed path, and stop at the submit button. Conditional
        // clear-button stops are absorbed automatically by recording the observed path.
        let forwardPath: string[] = []
        cy.then(() => tabPath(20, false, isSubmit)).then((forward: string[]) => {
            forwardPath = forward

            const anchors = [
                "select:accountId",
                "field:name",
                "select:type",
                "field:amount",
                "field:description",
                "select:categoryId",
                "select:counterpartyId",
                "select:tagIds"
            ]

            const positions = anchors.map(a => forward.indexOf(a))
            expect(positions.every(p => p >= 0),
                `every anchor select/field reachable in forward path: ${JSON.stringify(forward)}`).to.be.true

            for (let i = 1; i < positions.length; i++) {
                expect(positions[i], `anchor '${anchors[i]}' comes after '${anchors[i - 1]}' in tab order`).to.be.greaterThan(positions[i - 1])
            }
        })

        // Shift+Tab from the submit button (where the forward walk stopped) must retrace the
        // exact observed forward path in reverse, stopping back at the Account select.
        cy.then(() => tabPath(forwardPath.length, true, (id) => id === forwardPath[0])).then((backward: string[]) => {
            const expected = [...forwardPath].reverse()
            expect(backward, "Shift+Tab path equals exact reverse of forward Tab path").to.deep.equal(expected)
        })
    })

    it("opens every select trigger with Enter, Space and ArrowDown", () => {
        cy.visit("/transactions/new")

        const triggers = [
            { for: "accountId" },
            { for: "type" },
            { for: "categoryId" },
            { for: "counterpartyId" },
            { for: "tagIds" }
        ]

        triggers.forEach(({ for: field }) => {
            (["Enter", " ", "ArrowDown"] as const).forEach((key) => {
                cy.get(`label[for='${field}']`).next("[role='select-field']").focus()
                cy.realPress(key)
                cy.get("[role='listbox'], [role='dialog']").should("be.visible")
                cy.get("body").type("{esc}")
                cy.get("[data-radix-popper-content-wrapper]").should("not.exist")
            })
        })
    })

    it("reaches the Value Date trigger by Tab and still opens its calendar on click", () => {
        cy.visit("/transactions/new")

        // The Value Date trigger is the focusable element right after the Name input.
        cy.get("input[name='name']").focus()
        cy.realPress("Tab")
        cy.focused().should("have.prop", "tagName", "BUTTON")

        // Click-to-open behaviour is unchanged by the tab-order fix.
        cy.focused().click()
        cy.get("[role='dialog'], [data-radix-popper-content-wrapper]").should("be.visible")
    })

    it("keeps plain toolbar search inputs focusable only on their inner input (no extra tab stop)", () => {
        cy.get("li a[href='/transactions']").click()

        const searchInput = cy.get("input[placeholder='Search transactions']")
        searchInput.focus()
        cy.focused().should("have.attr", "data-slot", "input-group-control")

        // The shared InputGroup wrapper is not itself focusable.
        searchInput.parent("[data-slot='input-group']").should("not.have.attr", "tabindex")
    })
})
