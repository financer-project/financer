import React from "react"
import { Form, Formik } from "formik"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"

interface TestObject {
    select: string | null | string[]
}

describe("<SelectFormField />", () => {
    const options = [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
        { label: "Option 3", value: "option3" }
    ]

    const TestForm = ({
                          initialValues,
                          onSubmit = () => {
                          },
                          props
                      }: {
        initialValues: { select: string | null | string[] }
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

    describe("Single Selection", () => {


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
                        onChange: handleChange
                    }}
                />
            )

            cy.get("button").contains("Select option ...").should("be.visible")

            cy.get("button").contains("Select option ...").click()
            cy.get("div[role='listbox']").find("div[role='option']").should("have.length", 3)

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
                        options
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
                        readonly: true
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
                        onChange: handleChange
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

    describe("Multiple Selection", () => {
        it("selects multiple options", () => {
            const handleChange = cy.stub().as("handleChange")
            const handleSubmit = cy.stub().as("handleSubmit")

            cy.mount(
                <TestForm
                    initialValues={{ select: [] }}
                    onSubmit={handleSubmit}
                    props={{
                        name: "select",
                        label: "Select",
                        options,
                        multiple: true,
                        onChange: handleChange
                    }}
                />
            )

            cy.get("button").contains("Select option ...").should("be.visible")

            // Select first option
            cy.get("button").contains("Select option ...").click()
            cy.get("div[role='listbox'] div div:nth-child(1)").click()
            cy.get("@handleChange").should("have.been.calledWith", ["option1"])

            // Select second option (dropdown stays open in multiple mode)
            cy.get("div[role='listbox'] div div:nth-child(2)").click()
            cy.get("@handleChange").should("have.been.calledWith", ["option1", "option2"])

            // Verify both options are displayed
            cy.get("button").should("contain.text", "Option 1")
            cy.get("button").should("contain.text", "Option 2")

            // Submit the form
            cy.get("button").contains("Submit").click()
            cy.get("@handleSubmit").should("have.been.calledWith")
        })

        it("deselects an option from multiple selections", () => {
            const handleChange = cy.stub().as("handleChange")
            const handleSubmit = cy.stub().as("handleSubmit")

            cy.mount(
                <TestForm
                    initialValues={{ select: ["option1", "option2"] }}
                    onSubmit={handleSubmit}
                    props={{
                        name: "select",
                        label: "Select",
                        options,
                        multiple: true,
                        onChange: handleChange
                    }}
                />
            )

            // Verify initial state
            cy.get("button").should("contain.text", "Option 1")
            cy.get("button").should("contain.text", "Option 2")

            // Deselect first option
            cy.get("button").eq(0).click()
            cy.get("div[role='listbox'] div div:nth-child(1)").click()
            cy.get("@handleChange").should("have.been.calledWith", ["option2"])

            // Submit the form
            cy.get("button").contains("Submit").click()
            cy.get("@handleSubmit").should("have.been.calledWith")
        })

        it("renders with predefined multiple values", () => {
            cy.mount(
                <TestForm
                    initialValues={{ select: ["option1", "option3"] }}
                    props={{
                        name: "select",
                        label: "Select",
                        options,
                        multiple: true
                    }}
                />
            )

            cy.get("button").should("contain.text", "Option 1")
            cy.get("button").should("contain.text", "Option 3")
            cy.get("button").should("not.contain.text", "Option 2")
        })

        it("clears all selected values when the clear button is pressed", () => {
            const handleChange = cy.stub().as("handleChange")
            const handleSubmit = cy.stub().as("handleSubmit")

            cy.mount(
                <TestForm
                    initialValues={{ select: ["option1", "option2"] }}
                    onSubmit={handleSubmit}
                    props={{
                        name: "select",
                        label: "Select",
                        options,
                        multiple: true,
                        onChange: handleChange
                    }}
                />
            )

            cy.get("button").should("contain.text", "Option 1")
            cy.get("button").should("contain.text", "Option 2")

            cy.get("button svg").last().parent().click()
            cy.get("@handleChange").should("have.been.calledWith", [])
            cy.get("button").should("contain.text", "Select option ...")

            cy.get("button").contains("Submit").click()
            cy.get("@handleSubmit").should("have.been.calledWith")
        })
    })
})
