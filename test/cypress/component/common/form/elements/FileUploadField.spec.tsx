import React from "react"
import { Formik, Form } from "formik"
import FileUploadField from "@/src/lib/components/common/form/elements/FileUploadField"

interface TestObject {
    file: File | null
}

describe("<FileUploadField />", () => {
    // Helper function to create a test file
    const createTestFile = (name = "test.csv", type = "text/csv") => {
        const file = new File(["test file content"], name, { type })
        return file
    }

    const TestForm = ({
        initialValues,
        onSubmit = () => {},
        props,
    }: {
        initialValues: { file: File | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof FileUploadField<TestObject>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <FileUploadField<TestObject> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("uploads a file", () => {
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")
        const testFile = createTestFile()

        cy.mount(
            <TestForm
                initialValues={{ file: null }}
                onSubmit={handleSubmit}
                props={{
                    name: "file",
                    label: "Upload File",
                    accept: ".csv",
                    readonly: false,
                    onChange: handleChange,
                }}
            />
        )

        // Check that the file input is visible
        cy.get("input[type='file']").should("be.visible")

        // Upload a file
        cy.get("input[type='file']").selectFile(testFile, { force: true })
        
        // Check that the onChange handler was called with the file
        cy.get("@handleChange").should("have.been.called")
        
        // Check that the file name is displayed
        cy.get("p").contains("Selected file: test.csv").should("be.visible")

        // Submit the form
        cy.get("button").contains("Submit").click()
        cy.get("@handleSubmit").should("have.been.calledWith")
    })

    it("renders with readonly property set to true", () => {
        cy.mount(
            <TestForm
                initialValues={{ file: null }}
                props={{
                    name: "file",
                    label: "Upload File",
                    accept: ".csv",
                    readonly: true,
                }}
            />
        )

        // Check that the file input is disabled
        cy.get("input[type='file']").should("be.disabled")
    })

    it("validates file type", () => {
        const handleChange = cy.stub().as("handleChange")
        const testFile = createTestFile("test.txt", "text/plain")

        cy.mount(
            <TestForm
                initialValues={{ file: null }}
                props={{
                    name: "file",
                    label: "Upload File",
                    accept: ".csv",
                    readonly: false,
                    onChange: handleChange,
                }}
            />
        )

        // Upload a file with incorrect type
        cy.get("input[type='file']").selectFile(testFile, { force: true })
        
        // The onChange handler should still be called
        cy.get("@handleChange").should("have.been.called")
    })

    it("renders with a required label", () => {
        cy.mount(
            <TestForm
                initialValues={{ file: null }}
                props={{
                    name: "file",
                    label: "Upload File",
                    accept: ".csv",
                    required: true,
                }}
            />
        )

        // Check that the label has an asterisk
        cy.get("label").should("contain.text", "Upload File")
        cy.get("label span").should("contain.text", "*")
    })
})