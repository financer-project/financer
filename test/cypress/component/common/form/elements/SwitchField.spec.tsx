import React from "react"
import { Form, Formik } from "formik"
import SwitchField from "@/src/lib/components/common/form/elements/SwitchField"

interface TestObject {
    toggle: boolean
}

describe("<SwitchField />", () => {
    const TestForm = ({
                          initialValues,
                          onSubmit = () => {
                          },
                          props
                      }: {
        initialValues: { toggle: boolean }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof SwitchField<TestObject>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <SwitchField<TestObject> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("renders with default value (false)", () => {
        cy.mount(
            <TestForm
                initialValues={{ toggle: false }}
                props={{
                    name: "toggle",
                    label: "Toggle Switch"
                }}
            />
        )

        cy.get("input[type='hidden']").should("have.value", "false")
        cy.get("p").should("contain.text", "Toggle Switch")
        cy.get("button[role='switch']").should("have.attr", "aria-checked", "false")
    })

    it("renders with true value", () => {
        cy.mount(
            <TestForm
                initialValues={{ toggle: true }}
                props={{
                    name: "toggle",
                    label: "Toggle Switch"
                }}
            />
        )

        cy.get("input[type='hidden']").should("have.value", "true")
        cy.get("button[role='switch']").should("have.attr", "aria-checked", "true")
    })

    it("changes value when clicked", () => {
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                initialValues={{ toggle: false }}
                onSubmit={handleSubmit}
                props={{
                    name: "toggle",
                    label: "Toggle Switch",
                    onChange: handleChange
                }}
            />
        )

        cy.get("button[role='switch']").click()
        // Since we're not directly calling onChange in the component, we can't check it here
        // Instead, we'll verify the input value changed
        cy.get("input[type='hidden']").should("have.value", "true")
        cy.get("button[role='switch']").should("have.attr", "aria-checked", "true")

        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { toggle: true })
    })

    it("renders with a description", () => {
        cy.mount(
            <TestForm
                initialValues={{ toggle: false }}
                props={{
                    name: "toggle",
                    label: "Toggle Switch",
                    description: "This is a description"
                }}
            />
        )

        cy.get("p").should("contain.text", "Toggle Switch")
        cy.get("small").should("contain.text", "This is a description")
    })

    it("renders in disabled state", () => {
        cy.mount(
            <TestForm
                initialValues={{ toggle: false }}
                props={{
                    name: "toggle",
                    label: "Toggle Switch",
                    readonly: true
                }}
            />
        )

        cy.get("button[role='switch']").should("have.attr", "disabled")
    })

    it("renders with showCard prop", () => {
        cy.mount(
            <TestForm
                initialValues={{ toggle: false }}
                props={{
                    name: "toggle",
                    label: "Toggle Switch",
                    showCard: true
                }}
            />
        )

        // Check that the card does NOT have shadow-none when showCard is true
        cy.get(".shadow-none").should("not.exist")

        // Mount again with showCard false (default)
        cy.mount(
            <TestForm
                initialValues={{ toggle: false }}
                props={{
                    name: "toggle",
                    label: "Toggle Switch"
                }}
            />
        )

        // Check that the card has shadow-none when showCard is false/undefined
        cy.get(".shadow-none").should("exist")
    })
})