import { TestData } from "@/test/utility/TestUtility"

describe("Households", () => {
    let testData: TestData

    const createNewHousehold = () => {
        cy.get("a[href='/households/new']").click()
        cy.get("input[name='name']").type("A New Household")
        cy.selectField({ for: "currency", value: "Euro" })
        cy.get("textarea[name='description']").type("New Household")
        cy.get("button[type='submit']").click()
    }

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/dashboard")
            cy.get("a[href='/households']").click()
        })
    })

    it("should display an own household", () => {
        cy.get("tbody tr").should("have.length", 1)
        cy.get("tbody tr:first-child").click()
        cy.url().should("include", `/households/${testData.households.standard.id}`)
    })

    it("should not display households of other users", () => {
        cy.visit(`/households/${testData.households.admin.id}`)
    })

    it("should create a household and delete", () => {
        createNewHousehold()

        cy.component("dataItem").should("contain.text", "A New Household")
        cy.component("dataItem").should("contain.text", "Euro (EUR)")

        cy.get(".bg-destructive").click()
        cy.get(".bg-primary").contains("Confirm").click()

        cy.get("tbody tr").should("have.length", 1)
    })

    it("should select the current household", () => {
        cy.get("button[data-sidebar='menu-button'] span").first().should("contain.text", testData.households.standard.name)
        cy.get("tbody tr:nth-child(1) td:nth-child(2) div").should("have.text", "Active")

        createNewHousehold()
        cy.component("dataItem").should("contain.text", "A New Household")

        // navigate to /households
        cy.get("a[href='/households'][data-sidebar='menu-button']").click()
        cy.get("tbody tr:nth-child(1) td:nth-child(2) div").should("have.text", "Inactive")
        cy.get("tbody tr:nth-child(2) td:nth-child(2) div").should("have.text", "Active")
        cy.get("button[data-sidebar='menu-button'] span").first().click()

        // switch current household
        cy.get("div[role='menuitem']")
            .should("have.length", 2)
            .first().click()
        cy.get("a[href='/households'][data-sidebar='menu-button']").click()
        cy.get("tbody tr:nth-child(1) td:nth-child(2) div").should("have.text", "Active")
        cy.get("tbody tr:nth-child(2) td:nth-child(2) div").should("have.text", "Inactive")
    })

    it("should add an existing user to household, change role, and remove them", () => {
        // Navigate to the household details page
        cy.get("tbody tr:first-child").click()

        // Verify we're on the household page
        cy.url().should("include", `/households/${testData.households.standard.id}`)

        // Initially should only have the owner as member
        cy.get("div").contains("Members").should("exist")

        // Click "Add member" button
        cy.get("button").contains("Add member").click()

        // Fill in the add member form with admin user's email
        cy.get("input[name='email']").type(testData.users.admin.email)

        // Submit the form
        cy.get("button[type='submit']").contains("Add").click()

        // Verify member was added
        cy.contains(testData.users.admin.email).should("exist")

        // Find the admin user's row and click the Edit button
        cy.contains("tr", testData.users.admin.email).within(() => {
            cy.get("button").first().click()
        })

        // Change role to ADMIN
        cy.selectField({ for: "role", value: "ADMIN" })
        cy.get("button").contains("Save").click()

        // Verify role was changed
        cy.contains("tr", testData.users.admin.email).should("contain.text", "ADMIN")

        // Remove the member
        cy. contains("tr", testData.users.admin.email).within(() => {
            cy.get("button").last().click()
        })

        // Confirm the removal in the dialog
        cy.get(".bg-primary").contains("Confirm").click()

        // Verify member was removed
        cy.contains("tr", testData.users.admin.email).should("not.exist")
    })

    it("should allow guest user to view transactions but not create them", () => {
        cy.changeUser(testData.users.admin)

        cy.get("a[href='/households']").click()

        // User 1 (standard) adds User 2 (admin) as a GUEST to their household
        cy.get("tbody tr:first-child").click()
        cy.url().should("include", `/households/${testData.households.admin.id}`)

        // Add admin user as GUEST
        cy.get("button").contains("Add member").click()
        cy.get("input[name='email']").type(testData.users.standard.email)
        cy.selectField({ for: "role", value: "GUEST" })
        cy.get("button[type='submit']").contains("Add").click()

        // Verify guest was added
        cy.contains(testData.users.standard.email).should("exist")
        cy.contains("tr", testData.users.standard.email).should("contain.text", "GUEST")

        // Log out and log in as admin user (guest)
        cy.changeUser(testData.users.standard)

        // Switch to the shared household
        cy.get("button[data-sidebar='menu-button'] span").first().click()
        cy.contains("div[role='menuitem']", testData.households.admin.name).click()

        // Navigate to transactions
        cy.get("li a[href='/transactions']").click()

        // Verify guest can see transactions (should be 2 seeded transactions)
        cy.get("tbody tr").should("have.length", 2)

        // Try to create new transaction
        cy.get("a[href='/transactions/new']").first().click()
        cy.get("input[name='name']").type("Salary")
        cy.selectField({ for: "type", value: "Income" })
        cy.get("input[name='amount']").type("100.00")
        cy.get("button[type='submit']").click()

        cy.contains("AuthorizationError").should("exist")
    })
})
