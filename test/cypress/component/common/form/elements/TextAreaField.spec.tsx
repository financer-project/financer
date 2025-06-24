import React from "react"
import { Form, Formik } from "formik"
import TextAreaField from "@/src/lib/components/common/form/elements/TextAreaField"

interface TestObject {
    content: string
}

describe("<TextAreaField />", () => {
    const TestForm = ({
                          initialValues,
                          onSubmit = () => {},
                          props
                      }: {
        initialValues: { content: string | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof TextAreaField<TestObject>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <TextAreaField<TestObject> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("renders with default value", () => {
        cy.mount(
            <TestForm
                initialValues={{ content: "Default Content" }}
                props={{
                    name: "content",
                    label: "Text Area Field",
                }}
            />
        )

        cy.get("textarea").should("have.value", "Default Content")
        cy.get("label").should("contain.text", "Text Area Field")
    })

    it("renders with null value", () => {
        cy.mount(
            <TestForm
                initialValues={{ content: null }}
                props={{
                    name: "content",
                    label: "Text Area Field",
                }}
            />
        )

        cy.get("textarea").should("have.value", "")
    })

    it("updates value when typed into", () => {
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                initialValues={{ content: "" }}
                onSubmit={handleSubmit}
                props={{
                    name: "content",
                    label: "Text Area Field",
                }}
            />
        )

        cy.get("textarea").type("New Content\nWith multiple lines")
        cy.get("textarea").should("have.value", "New Content\nWith multiple lines")

        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { content: "New Content\nWith multiple lines" })
    })

    it("renders with a placeholder", () => {
        cy.mount(
            <TestForm
                initialValues={{ content: "" }}
                props={{
                    name: "content",
                    label: "Text Area Field",
                    placeholder: "Enter content here..."
                }}
            />
        )

        cy.get("textarea").should("have.attr", "placeholder", "Enter content here...")
    })

    it("renders in disabled state", () => {
        cy.mount(
            <TestForm
                initialValues={{ content: "Disabled Content" }}
                props={{
                    name: "content",
                    label: "Text Area Field",
                    readonly: true
                }}
            />
        )

        cy.get("textarea").should("have.attr", "disabled")
    })

    it("handles form validation", () => {
        const handleSubmit = cy.stub().as("handleSubmit")
        
        cy.mount(
            <Formik 
                initialValues={{ content: "" }}
                validate={(values) => {
                    const errors: { content?: string } = {}
                    if (!values.content) {
                        errors.content = "Required"
                    } else if (values.content.length < 10) {
                        errors.content = "Content must be at least 10 characters"
                    }
                    return errors
                }}
                onSubmit={handleSubmit}
            >
                <Form>
                    <TextAreaField<TestObject>
                        name="content"
                        label="Required Field"
                    />
                    <button type="submit">Submit</button>
                </Form>
            </Formik>
        )

        // Submit the form without entering text
        cy.get("button[type='submit']").click()
        
        // Check that the error message is displayed
        cy.get(".text-destructive").should("contain.text", "Required")
        
        // Check that the submit handler was not called
        cy.get("@handleSubmit").should("not.have.been.called")
        
        // Enter short text and submit again
        cy.get("textarea").type("Short")
        cy.get("button[type='submit']").click()
        
        // Check that the error message for short text is displayed
        cy.get(".text-destructive").should("contain.text", "Content must be at least 10 characters")
        
        // Check that the submit handler was not called
        cy.get("@handleSubmit").should("not.have.been.called")
        
        // Clear and enter valid text
        cy.get("textarea").clear().type("This is a valid content with more than 10 characters")
        cy.get("button[type='submit']").click()
        
        // Check that the submit handler was called with the correct values
        cy.get("@handleSubmit").should("have.been.calledWith", { 
            content: "This is a valid content with more than 10 characters" 
        })
    })
})