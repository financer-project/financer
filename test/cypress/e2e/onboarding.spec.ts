describe("Onboarding Flow", () => {
    beforeEach(() => {
        // Reset database completely (including users) to ensure clean state for onboarding
        cy.resetAndSeedDatabase(() => {
            cy.visit("/")
        }, true)
    })


    it("should complete the full onboarding process", () => {
        cy.url().should("include", "/onboarding")

        // Verify step visualization shows step 1 as current
        cy.get(".flex.w-full.py-4.relative").should("exist")

        // Fill in user account form
        cy.get("input[name='firstName']").should("not.be.disabled").type("Admin")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("admin@financer.com")
        cy.get("input[name='password']").type("password123456").blur()

        // Click Next to go to step 2
        cy.get("button").contains("Next").click()

        // Fill in household form
        cy.get("input[name='householdName']").type("My Test Household")
        cy.get("label[for='currency'] + div").type("Euro{enter}")
        cy.get("textarea[name='description']").type("This is a test household for onboarding")

        // Click Next to go to step 3
        cy.get("button").contains("Next").click()

        // Configure admin settings - using patterns from adminSettings tests
        // Default language dropdown
        cy.get("label[for='defaultLanguage'] + div").type("German{enter}")
        cy.get("label[for='defaultTheme'] + div").type("Dark{enter}")

        // Allow registration checkbox - should be checked by default
        cy.get("input[name='allowRegistration']").click()

        // Submit the onboarding form
        cy.get("button").contains("Submit").click()

        // Should redirect to dashboard after successful onboarding
        cy.url().should("include", "/dashboard")
    })

    it("should navigate between steps using Previous button", () => {
        cy.visit("/")
        cy.url().should("include", "/onboarding")

        // Fill Step 1 and go to Step 2
        cy.get("input[name='firstName']").type("Test")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("test@example.com")
        cy.get("input[name='password']").type("password123456")
        cy.get("button").contains("Next").click()

        // Go back to Step 1
        cy.get("button").contains("Previous").click()

        // Verify back on Step 1 and form data is preserved
        cy.get("input[name='firstName']").should("have.value", "Test")
        cy.get("input[name='lastName']").should("have.value", "User")
        cy.get("input[name='email']").should("have.value", "test@example.com")
        cy.get("input[name='password']").should("have.value", "password123456")
    })

    it("should validate form fields on each step", () => {
        cy.visit("/")
        cy.url().should("include", "/onboarding")

        // Try to proceed without filling required fields
        cy.get("button").contains("Next").click()

        // Fill partial data and try again
        cy.get("input[name='firstName']").type("Test")
        cy.get("button").contains("Next").click()

        // Fill all required fields for step 1
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("test@example.com")
        cy.get("input[name='password']").type("password123456")
        cy.get("button").contains("Next").click()

        // Try to proceed without filling household name
        cy.get("button").contains("Next").click()
    })

    it("should redirect to dashboard if onboarding already completed", () => {
        // First complete the onboarding
        cy.visit("/")

        // Quick onboarding completion
        cy.get("input[name='firstName']").type("Admin")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("admin@financer.com")
        cy.get("input[name='password']").type("password123456")
        cy.get("button").contains("Next").click()

        cy.get("input[name='householdName']").type("Test Household")
        cy.get("label[for='currency'] + div").type("United States Dollar (USD){enter}")
        cy.get("button").contains("Next").click()

        cy.get("button").contains("Complete Setup").click()
        cy.url().should("include", "/dashboard")

        // Now try to access onboarding again
        cy.visit("/onboarding")

        // Should redirect to dashboard since onboarding is complete
        cy.url().should("include", "/dashboard")
    })

    it("should handle onboarding errors gracefully", () => {
        cy.visit("/")
        cy.url().should("include", "/onboarding")

        // Fill form with potentially problematic data
        cy.get("input[name='firstName']").type("Test")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("invalid-email") // Invalid email
        cy.get("input[name='password']").type("short") // Too short password
        cy.get("button").contains("Next").click()

        // Fix the data
        cy.get("input[name='email']").clear().type("test@example.com")
        cy.get("input[name='password']").clear().type("password123456")
        cy.get("button").contains("Next").click()
    })
})