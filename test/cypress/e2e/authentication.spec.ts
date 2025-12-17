import { TestData } from "@/test/utility/TestUtility"
import { TokenType } from "@prisma/client"

describe("Authentication Spec", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase((result) => {
            testData = result as TestData
            cy.visit("/")
        }, true)
    })

    after(() => {
        cy.task("resetDatabase", true)
    })

    it("Create a new user", () => {
        cy.get("a[href='/signup']").click()

        cy.get("input[name='firstName']").type("Cypress")
        cy.get("input[name='lastName']").type("Test")
        cy.get("input[name='email']").type("cypress2@test.com")
        cy.get("input[name='password']").type("password123")
        cy.get("button[type='submit']").click()

        // Should redirect to dashboard after successful signup
        cy.url().should("include", "/dashboard")

        // Since this is a new user without a household, the RequireHouseholdDialog should appear
        cy.get("div[role='dialog']").should("be.visible")
        cy.contains("Create Your First Household").should("exist")

        // Fill in the household form in the dialog
        cy.get("input[name='name']").type("My First Household")
        cy.selectField({ for: "currency", value: "Euro" })
        cy.get("textarea[name='description']").type("Test household description")
        cy.get("button[type='submit']").contains("Create Household").click()

        // Should navigate to dashboard after successful household creation
        cy.url().should("include", "/dashboard")
        cy.get("div").contains("Dashboard").should("exist")
        cy.contains("My First Household").should("exist")
    })

    it("Login with existing user", () => {
        cy.get("a[href='/login']").click()

        cy.get("input[name='email']").type("user@financer.com")
        cy.get("input[name='password']").type("password")
        cy.get("button[type='submit']").click()

        cy.url().should("include", "/dashboard")
        cy.get("div").contains("Dashboard").should("exist")
    })

    it("Sign up with INVITATION token", () => {
        const newUserEmail = "invited@test.com"

        // Create an INVITATION token
        cy.task("createToken", {
            type: TokenType.INVITATION,
            email: newUserEmail,
            userId: testData.users.admin.id
        }).then((result: any) => {
            const token = result.token

            // Visit signup page with token
            cy.visit(`/signup?token=${token}`)

            // Fill in user details
            cy.get("input[name='firstName']").type("Invited")
            cy.get("input[name='lastName']").type("User")
            cy.get("input[name='email']").type(newUserEmail)
            cy.get("input[name='password']").type("password123")
            cy.get("button[type='submit']").click()

            // Should redirect to dashboard after successful signup
            cy.url().should("include", "/dashboard")

            // Since this is a new user without a household, the RequireHouseholdDialog should appear
            cy.get("div[role='dialog']").should("be.visible")
            cy.contains("Create Your First Household").should("exist")

            // Fill in the household form in the dialog
            cy.get("input[name='name']").type("Invited User Household")
            cy.selectField({ for: "currency", value: "US Dollar" })
            cy.get("textarea[name='description']").type("Household for invited user")
            cy.get("button[type='submit']").contains("Create Household").click()

            // Should redirect to the newly created household page
            cy.contains("Invited User Household").should("exist")
            cy.url().should("contains", "/dashboard")
        })
    })

    it("Sign up with INVITATION_HOUSEHOLD token", () => {
        const newUserEmail = "household-invited@test.com"

        // Create an INVITATION_HOUSEHOLD token with household info
        cy.task("createToken", {
            type: TokenType.INVITATION_HOUSEHOLD,
            email: newUserEmail,
            userId: testData.users.admin.id,
            content: {
                householdId: testData.households.standard.id,
                role: "MEMBER"
            }
        }).then((result: any) => {
            const token = result.token

            // Visit signup page with token
            cy.visit(`/signup?token=${token}`)

            // Fill in user details
            cy.get("input[name='firstName']").type("Household")
            cy.get("input[name='lastName']").type("Member")
            cy.get("input[name='email']").type(newUserEmail)
            cy.get("input[name='password']").type("password123")
            cy.get("button[type='submit']").click()

            // Should redirect to dashboard after successful signup
            cy.url().should("include", "/dashboard")

            // The RequireHouseholdDialog should NOT appear since user was added to a household
            cy.get("div[role='dialog']").should("not.exist")

            // Verify user can access the shared household
            cy.get("button[data-sidebar='menu-button'] span").first().should("contain.text", testData.households.standard.name)

            // Navigate to households page to verify membership
            cy.get("a[href='/households']").click()
            cy.get("tbody tr").should("have.length.at.least", 1)
            cy.get("tbody tr").contains(testData.households.standard.name).should("exist")
        })
    })

    it("Reset password with token", () => {
        const userEmail = testData.users.standard.email
        const newPassword = "newpassword123"

        // Create a RESET_PASSWORD token
        cy.task("createToken", {
            type: "RESET_PASSWORD",
            email: userEmail,
            userId: testData.users.standard.id
        }).then((result: any) => {
            const token = result.token

            // Visit reset password page with token
            cy.visit(`/reset-password?token=${token}`)

            // Fill in new password
            cy.get("input[name='password']").type(newPassword)
            cy.get("input[name='passwordConfirmation']").type(newPassword)
            cy.get("button[type='submit']").click()

            // Should redirect to dashboard after successful password reset
            cy.contains("Your password has been reset. You can now log in.").should("exist")
            cy.url().should("contain", "/login")
        })
    })

    it("Should reject expired or invalid invitation token", () => {
        cy.visit("/signup?token=invalid-token-123")

        cy.get("input[name='firstName']").type("Invalid")
        cy.get("input[name='lastName']").type("User")
        cy.get("input[name='email']").type("invalid@test.com")
        cy.get("input[name='password']").type("password123")
        cy.get("button[type='submit']").click()

        // Should show error message for invalid token
        cy.contains("Invalid or expired invitation token").should("exist")
    })

    it("Should reject invalid reset password token", () => {
        cy.visit("/reset-password?token=invalid-token-123")

        cy.get("input[name='password']").type("newpassword123")
        cy.get("input[name='passwordConfirmation']").type("newpassword123")
        cy.get("button[type='submit']").click()

        // Should show error message for invalid token
        cy.contains("Could not reset password").should("exist")
    })
})