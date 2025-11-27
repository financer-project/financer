describe("Onboarding Flow", () => {
    beforeEach(() => {
        // Reset database completely (including users) to ensure clean state for onboarding
        cy.resetDatabase(() => {
            cy.visit("/")
            cy.url().should("include", "/onboarding")

            cy.get(".flex.w-full.py-4.relative").should("exist")

            cy.get("input[name='firstName']").should("not.be.disabled")
            cy.wait(500)
        }, true)
    })


    it("should complete the full onboarding process", () => {
        // Fill in user account form
        cy.get("input[name='firstName']").should("not.be.disabled")
        cy.wait(500)
        cy.get("input[name='firstName']").type("Admin")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("admin@financer.com")
        cy.get("input[name='password']").type("password123456")
        cy.press(Cypress.Keyboard.Keys.TAB)

        cy.get("button").contains("Next")
            .should("not.be.disabled")
            .click()
        // Click Next to go to step 2

        // Fill in household form
        cy.get("input[name='householdName']").type("My Test Household")
        cy.selectField({ for: "currency", value: "Euro" })
        cy.get("textarea[name='description']").type("This is a test household for onboarding")

        // Click Next to go to step 3
        cy.get("button").contains("Next").click()

        // Configure admin settings - using patterns from adminSettings tests
        // Default language dropdown
        cy.selectField({ for: "defaultLanguage", value: "German" })
        cy.selectField({ for: "defaultTheme", value: "Dark" })

        // Allow registration checkbox - should be checked by default
        cy.get("input[name='allowRegistration']").click()

        // Submit the onboarding form
        cy.get("button").contains("Submit").click()

        // Should redirect to dashboard after successful onboarding
        cy.url().should("include", "/dashboard")
    })

    it("should navigate between steps using Back button", () => {
        // Fill Step 1 and go to Step 2
        cy.get("input[name='firstName']").type("Test")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("test@example.com")
        cy.get("input[name='password']").type("password123456")
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.get("button").contains("Next").click()

        // Go back to Step 1
        cy.get("button").contains("Back").click()

        // Verify back on Step 1 and form data is preserved
        cy.get("input[name='firstName']").should("have.value", "Test")
        cy.get("input[name='lastName']").should("have.value", "User")
        cy.get("input[name='email']").should("have.value", "test@example.com")
        cy.get("input[name='password']").should("have.value", "password123456")
    })

    it("should validate form fields on each step", () => {
        // Fill partial data and try again
        cy.get("input[name='firstName']").type("Test")
        cy.get("button").contains("Next").click()
        cy.get("button").contains("Next").should("be.disabled")

        // Fill all required fields for step 1
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("test@example.com")
        cy.get("input[name='password']").type("password123456")
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.get("button").contains("Next").click()
    })

    it("should redirect to dashboard if onboarding already completed", () => {
        // Quick onboarding completion
        cy.get("input[name='firstName']").type("Admin")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("admin@financer.com")
        cy.get("input[name='password']").type("password123456")
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.get("button").contains("Next").click()

        cy.get("input[name='householdName']").type("Test Household")
        cy.selectField({ for: "currency", value: "United States Dollar (USD)" })
        cy.get("button").contains("Next").click()

        cy.get("button").contains("Submit").click()
        cy.url().should("include", "/dashboard")

        // Now try to access onboarding again
        cy.visit("/onboarding")

        // Should redirect to dashboard since onboarding is complete
        cy.url().should("include", "/dashboard")
    })

    it("should handle onboarding errors gracefully", () => {
        // Fill form with potentially problematic data
        cy.get("input[name='firstName']").type("Test")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("invalid-email") // Invalid email
        cy.get("input[name='password']").type("short") // Too short password
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.get("button").contains("Next").should("be.disabled")

        // Fix the data
        cy.get("input[name='email']").clear().type("test@example.com")
        cy.get("input[name='password']").clear().type("password123456")
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.get("button").contains("Next").click()
    })
})