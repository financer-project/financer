import React from "react"
import { Formik, Form } from "formik"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"

interface TestObject {
    select: string | null
}

describe("<SelectFormField />", () => {
    const options = [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
        { label: "Option 3", value: "option3" },
    ]

    const TestForm = ({
                          initialValues,
                          onSubmit = () => {},
                          props,
                      }: {
        initialValues: { select: string | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof SelectFormField<TestObject>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <SelectFormField<TestObject> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("selects an option", () => {
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                initialValues={{ select: null }}
                onSubmit={handleSubmit}
                props={{
                    name: "select",
                    label: "Select",
                    options,
                    readonly: false,
                    onChange: handleChange,
                }}
            />
        )

        cy.get("button").contains("Select option ...").should("be.visible")

        cy.get("button").contains("Select option ...").click()
        cy.get("div[role='listbox'] div").children().should("have.length", 3)

        cy.get("div[role='listbox'] div div:nth-child(2)").click()
        cy.get("button").should("contain.text", "Option 2")
        cy.get("@handleChange").should("have.been.calledWith", "option2")

        cy.get("button").contains("Submit").click()
        cy.get("@handleSubmit").should("have.been.calledWith")
    })

    it("renders with a predefined value", () => {
        const predefinedValue = "option3"
        cy.mount(
            <TestForm
                initialValues={{ select: predefinedValue }}
                props={{
                    name: "select",
                    label: "Select",
                    options,
                }}
            />
        )

        cy.get("button").should("contain.text", "Option 3")
    })

    it("renders with readOnly property set to true", () => {
        cy.mount(
            <TestForm
                initialValues={{ select: null }}
                props={{
                    name: "select",
                    label: "Select",
                    options,
                    readonly: true,
                }}
            />
        )

        cy.get("button").should("be.disabled")
    })

    it("clears the selected option when the clear button is pressed", () => {
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                initialValues={{ select: "option1" }}
                onSubmit={handleSubmit}
                props={{
                    name: "select",
                    label: "Select",
                    options,
                    onChange: handleChange,
                }}
            />
        )

        cy.get("button").should("contain.text", "Option 1")

        cy.get("button svg").last().parent().click()
        cy.get("@handleChange").should("have.been.calledWith", null)
        cy.get("button").should("contain.text", "Select option ...")

        cy.get("button").contains("Submit").click()
        cy.get("@handleSubmit").should("have.been.calledWith")
    })
})