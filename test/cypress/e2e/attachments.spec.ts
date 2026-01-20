import { TestData } from "@/test/utility/TestUtility"

describe("Attachments", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase(result => {
            testData = result as TestData
            cy.loginWithUser(testData.users.standard)
            cy.visit("/transactions")
            // Navigate to first transaction
            cy.get("tbody tr").first().click()
            cy.url().should("include", "/transactions/")
        })
    })

    it("should be able to upload, view, and delete an attachment", () => {
        // Verify attachments section exists and is empty
        cy.contains("h1", "Attachments").should("exist")
        cy.contains("No data yet").should("exist")

        // Upload a test file
        cy.get("input[type='file']").selectFile({
            contents: Cypress.Buffer.from("Test file content for attachment"),
            fileName: "test-attachment.txt",
            mimeType: "text/plain"
        }, { force: true })

        // Wait for upload to complete and verify the attachment appears in the table
        cy.contains("Attachment uploaded successfully").should("exist")
        cy.contains("test-attachment.txt").should("exist")
        cy.contains("text/plain").should("exist")

        // Verify view button exists (eye icon)
        cy.get("a[href*='/api/transactions/attachments/download/']")
            .not("[href*='download=true']")
            .should("exist")

        // Verify download button exists
        cy.get("a[href*='/api/transactions/attachments/download/'][href*='download=true']")
            .should("exist")

        // Delete the attachment
        cy.get("button.bg-destructive").last().click()

        // Confirm deletion in the dialog
        cy.contains("Delete attachment").should("exist")
        cy.contains("test-attachment.txt").should("exist")
        cy.get("button").contains("Confirm").click()

        // Verify attachment was deleted
        cy.contains("Attachment deleted successfully").should("exist")
        cy.contains("No data yet").should("exist")
        cy.contains("test-attachment.txt").should("not.exist")
    })

    it("should be able to upload multiple attachments", () => {
        // Upload first file
        cy.get("input[type='file']").selectFile({
            contents: Cypress.Buffer.from("First file content"),
            fileName: "first-file.txt",
            mimeType: "text/plain"
        }, { force: true })

        cy.contains("Attachment uploaded successfully").should("exist")
        cy.contains("first-file.txt").should("exist")

        // Upload second file
        cy.get("input[type='file']").selectFile({
            contents: Cypress.Buffer.from("PDF content simulation"),
            fileName: "document.pdf",
            mimeType: "application/pdf"
        }, { force: true })

        cy.contains("Attachment uploaded successfully").should("exist")
        cy.contains("document.pdf").should("exist")

        // Verify both attachments are in the table
        cy.get("tbody tr").should("have.length", 2)
        cy.contains("first-file.txt").should("exist")
        cy.contains("document.pdf").should("exist")

        // Clean up - delete both attachments
        cy.get("button.bg-destructive").last().click()
        cy.get("button").contains("Confirm").click()
        cy.contains("Attachment deleted successfully").should("exist")

        cy.get("button.bg-destructive").last().click()
        cy.get("button").contains("Confirm").click()
        cy.contains("Attachment deleted successfully").should("exist")

        cy.contains("No data yet").should("exist")
    })
})
