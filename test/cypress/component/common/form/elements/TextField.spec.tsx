import React from "react"
import { Form, Formik } from "formik"
import TextField from "@/src/lib/components/common/form/elements/TextField"

interface TestObject {
    text: string
}

describe("<TextField />", () => {
    const TestForm = ({
                          initialValues,
                          onSubmit = () => {},
                          props
                      }: {
        initialValues: { text: string | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof TextField<TestObject, string>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <TextField<TestObject, string> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("renders with default value", () => {
        cy.mount(
            <TestForm
                initialValues={{ text: "Default Text" }}
                props={{
                    name: "text",
                    label: "Text Field",
                }}
            />
        )

        cy.get("input").should("have.value", "Default Text")
        cy.get("label").should("contain.text", "Text Field")
    })

    it("renders with null value", () => {
        cy.mount(
            <TestForm
                initialValues={{ text: null }}
                props={{
                    name: "text",
                    label: "Text Field",
                }}
            />
        )

        cy.get("input").should("have.value", "")
    })

    it("updates value when typed into", () => {
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                initialValues={{ text: "" }}
                onSubmit={handleSubmit}
                props={{
                    name: "text",
                    label: "Text Field",
                    onChange: handleChange
                }}
            />
        )

        cy.get("input").type("New Text")
        cy.get("input").should("have.value", "New Text")
        cy.get("@handleChange").should("have.been.calledWith", "New Text")

        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { text: "New Text" })
    })

    it("renders with a placeholder", () => {
        cy.mount(
            <TestForm
                initialValues={{ text: "" }}
                props={{
                    name: "text",
                    label: "Text Field",
                    placeholder: "Enter text here..."
                }}
            />
        )

        cy.get("input").should("have.attr", "placeholder", "Enter text here...")
    })

    it("renders in disabled state", () => {
        cy.mount(
            <TestForm
                initialValues={{ text: "Disabled Text" }}
                props={{
                    name: "text",
                    label: "Text Field",
                    readonly: true
                }}
            />
        )

        cy.get("input").should("have.attr", "disabled")
    })

    it("renders with different input types", () => {
        // Test password type
        cy.mount(
            <TestForm
                initialValues={{ text: "password123" }}
                props={{
                    name: "text",
                    label: "Password Field",
                    type: "password"
                }}
            />
        )

        cy.get("input").should("have.attr", "type", "password")

        // Test email type
        cy.mount(
            <TestForm
                initialValues={{ text: "test@example.com" }}
                props={{
                    name: "text",
                    label: "Email Field",
                    type: "email"
                }}
            />
        )

        cy.get("input").should("have.attr", "type", "email")

        // Test number type
        cy.mount(
            <TestForm
                initialValues={{ text: "123" }}
                props={{
                    name: "text",
                    label: "Number Field",
                    type: "number"
                }}
            />
        )

        cy.get("input").should("have.attr", "type", "number")
    })

    it("handles form validation", () => {
        const handleSubmit = cy.stub().as("handleSubmit")
        
        cy.mount(
            <Formik 
                initialValues={{ text: "" }}
                validate={(values) => {
                    const errors: { text?: string } = {}
                    if (!values.text) {
                        errors.text = "Required"
                    }
                    return errors
                }}
                onSubmit={handleSubmit}
            >
                <Form>
                    <TextField<TestObject, string>
                        name="text"
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
        
        // Enter text and submit again
        cy.get("input").type("Valid Text")
        cy.get("button[type='submit']").click()
        
        // Check that the submit handler was called with the correct values
        cy.get("@handleSubmit").should("have.been.calledWith", { text: "Valid Text" })
    })
})