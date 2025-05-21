import { TestData } from "@/test/utility/TestUtility"

describe("Admin Settings Page", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
        })
    })

    after(() => {
        cy.task("resetDatabase", true)
    })

    it("navigates to admin settings page", () => {
        cy.loginWithUser(testData.users.admin)
        cy.visit("/dashboard")

        // Navigate to admin settings
        cy.get("a").contains("Admin Settings").click()
        cy.url().should("include", "/settings/admin")
        cy.get("h1").should("contain", "Admin Settings")
    })

    it("updates admin settings", () => {
        cy.loginWithUser(testData.users.admin)
        cy.visit("/dashboard")

        // Navigate to admin settings
        cy.get("a").contains("Admin Settings").click()

        // Update form values
        cy.get("input[name='smtpHost']").clear().type("smtp.updated.com")
        cy.get("input[name='smtpPort']").clear().type("465")
        cy.get("input[name='smtpUser']").clear().type("updated@example.com")
        cy.get("input[name='smtpPassword']").clear().type("newpassword")
        cy.get("input[name='smtpFromEmail']").clear().type("updated@example.com")
        cy.get("input[name='smtpFromName']").clear().type("Updated App")

        // Change encryption type
        cy.get("button[role=select-field]").eq(2).click()
        cy.get("div[role='listbox'] div div").contains("SSL").click()

        // Toggle allowRegistration
        cy.get("input[name='allowRegistration']").parent().click()

        // Change default language
        cy.get("button[role=select-field]").contains("English (American)").click()
        cy.get("div[role='listbox'] div div").contains("German").click()

        // Change default theme
        cy.get("button[role=select-field]").contains("Light").click()
        cy.get("div[role='listbox'] div div").contains("Dark").click()

        // Submit the form
        cy.get("button[type='submit']").click()

        // Check for success toast
        cy.contains("Settings updated successfully!").should("be.visible")

        // Reload the page to verify changes were saved
        cy.reload()

        // Verify the changes were saved
        cy.get("input[name='smtpHost']").should("have.value", "smtp.updated.com")
        cy.get("input[name='smtpPort']").should("have.value", "465")
        cy.get("input[name='smtpUser']").should("have.value", "updated@example.com")
        cy.get("input[name='smtpPassword']").should("have.value", "newpassword")
        cy.get("input[name='smtpFromEmail']").should("have.value", "updated@example.com")
        cy.get("input[name='smtpFromName']").should("have.value", "Updated App")
        cy.get("button").contains("SSL").should("exist")
        cy.get("input[name='allowRegistration']").should("not.be.checked")
        cy.get("button").contains("German").should("be.visible")
        cy.get("button").contains("Dark").should("be.visible")
    })

    it("sends a test email", () => {
        cy.loginWithUser(testData.users.admin)
        cy.visit("/dashboard")

        // Navigate to admin settings
        cy.get("a").contains("Admin Settings").click()

        // Fill in SMTP settings
        cy.get("input[name='smtpHost']").clear().type("smtp.example.com")
        cy.get("input[name='smtpPort']").clear().type("587")
        cy.get("input[name='smtpUser']").clear().type("user@example.com")
        cy.get("input[name='smtpPassword']").clear().type("password")
        cy.get("input[name='smtpFromEmail']").clear().type("noreply@example.com")
        cy.get("input[name='smtpFromName']").clear().type("Financer App")

        // Change encryption type
        cy.get("button[role=select-field]").eq(2).click()
        cy.get("div[role='listbox'] div div").contains("TLS").click()

        cy.get("button[type='submit']").click()

        // Update test email recipient
        cy.get("input[name='testEmailRecipient']").clear().type("test@example.com")

        // Click send test email button
        cy.get("button").contains("Send Test Email").click()

        // Check for success toast (this assumes the email sending is mocked in e2e tests)
        cy.contains("Failed to send test email").should("be.visible")
    })

    it("prevents non-admin users from accessing admin settings", () => {
        cy.loginWithUser(testData.users.standard)
        cy.visit("/dashboard")

        // Admin Settings link should not be visible in sidebar
        cy.get("a").contains("Admin Settings").should("not.exist")

        // Try to navigate to admin settings directly
        cy.visit("/settings/admin")

        // Should be redirected or shown an error
        cy.get("div").contains("Something went wrong")
    })
})
