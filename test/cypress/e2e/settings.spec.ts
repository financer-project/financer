import { TestData } from "@/test/utility/TestUtility"

describe("Settings Page", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/settings")
        }, true)
    })

    it("displays settings page with all sections", () => {
        cy.get("h1").should("contain", "Settings")
        cy.contains("h1", "Profile").should("exist")
        cy.contains("h1", "Security").should("exist")
        cy.contains("h1", "General").should("exist")
    })

    it("updates profile information successfully", () => {
        cy.get("input[name='firstName']").clear().type("UpdatedFirst")
        cy.get("input[name='lastName']").clear().type("UpdatedLast")
        cy.get("button[type='submit']").contains("Save Changes").click()

        cy.reload()

        cy.get("input[name='firstName']").should("have.value", "UpdatedFirst")
        cy.get("input[name='lastName']").should("have.value", "UpdatedLast")
    })

    it("shows error when email is already in use", () => {
        const adminEmail = testData.users.admin.email

        cy.get("input[name='email']").clear().type(adminEmail)
        cy.get("button[type='submit']").contains("Save Changes").click()

        cy.contains("Email is already in use").should("exist")
    })

    it("uploads and removes avatar successfully", () => {
        const greenPixelPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=="

        cy.get("input[type='file']").selectFile({
            contents: Cypress.Buffer.from(greenPixelPng, "base64"),
            fileName: "test-avatar.png",
            mimeType: "image/png"
        }, { force: true })

        // Crop dialog should open
        cy.get("div[role='dialog']").should("be.visible")
        cy.contains("Crop Profile Picture").should("exist")
        cy.get("div[role='dialog'] button").contains("Save").click()
        cy.get("div[role='dialog']").should("not.exist")

        // Avatar should be uploaded, Remove button should appear
        cy.get("button").contains("Remove").should("exist")
        cy.get("button").contains("Remove").click()

        // Should show initials again
        const user = testData.users.standard
        const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
        cy.get("span").contains(initials).should("exist")
    })

    it("changes password successfully", () => {
        const newPassword = "newpassword123"

        cy.get("button").contains("Change Password").click()
        cy.get("div[role='dialog']").should("be.visible")

        cy.get("input[name='currentPassword']").type("password")
        cy.get("input[name='newPassword']").type(newPassword)
        cy.get("input[name='confirmPassword']").type(newPassword)
        cy.get("div[role='dialog'] button[type='submit']").click()

        cy.get("div[role='dialog']").should("not.exist")

        // Verify new password works
        cy.get("button[data-sidebar='menu-button']").last().click()
        cy.contains("Log out").click()
        cy.url().should("contain", "/login")

        cy.get("input[name='email']").type(testData.users.standard.email)
        cy.get("input[name='password']").type(newPassword)
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/dashboard")
    })

    it("shows error for incorrect current password", () => {
        cy.get("button").contains("Change Password").click()

        cy.get("input[name='currentPassword']").type("wrongpassword")
        cy.get("input[name='newPassword']").type("newpassword123")
        cy.get("input[name='confirmPassword']").type("newpassword123")
        cy.get("div[role='dialog'] button[type='submit']").click()

        cy.contains("The credentials provided are invalid.").should("exist")
    })

    it("updates preferences successfully", () => {
        cy.selectField({ label: "Theme", value: "Dark" })
        cy.get("button[type='submit']").contains("Update Setting").click()

        cy.reload()

        cy.findSelectField({ label: "Theme" }).should("contain.text", "Dark")
    })
})
