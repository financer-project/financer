import React from "react"
import { Formik, Form } from "formik"
import DatePickerFormField from "@/src/lib/components/common/form/elements/DatePickerFormField"
import { DateTime } from "luxon"

interface TestObject {
    date: Date | null
}

describe("<DatePickerFormField />", () => {
    const TestForm = ({
                          initialValues,
                          onSubmit = () => {
                          },
                          props
                      }: {
        initialValues: { date: Date | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof DatePickerFormField<TestObject>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <DatePickerFormField<TestObject> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("selects a date", () => {
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(<TestForm
            initialValues={{ date: null }}
            onSubmit={handleSubmit}
            props={{
                name: "date",
                label: "Date",
                readonly: false,
                onChange: handleChange
            }} />)

        cy.get("button").contains("Select date...").should("be.visible")

        cy.get("button").contains("Select date...").click()

        cy.get("[role='dialog']").should("be.visible")
        cy.get("td button").contains("1").click()

        const selectedDate = DateTime.now().startOf("month").toJSDate().toLocaleDateString()
        cy.get("button").should("contain.text", selectedDate)

        cy.get("@handleChange").should("have.been.calledWith", Cypress.sinon.match.instanceOf(Date))
        cy.get("button").contains("Submit").click()

        cy.get("@handleSubmit").should("have.been.calledWith")
    })

    it("renders with a predefined value", () => {
        const predefinedDate = new Date(2023, 0, 1)
        cy.mount(<TestForm
            initialValues={{ date: null }}
            props={{
                name: "date",
                label: "Date",
                value: predefinedDate
            }} />)

        cy.get("button").should("contain.text", predefinedDate.toLocaleDateString())
    })

    it("renders with readOnly property set to true", () => {
        const predefinedDate = new Date(2023, 0, 1)
        cy.mount(<TestForm
            initialValues={{ date: null }}
            props={{
                name: "date",
                label: "Date",
                value: predefinedDate,
                readonly: true
            }} />)

        cy.get("button").should("contain.text", predefinedDate.toLocaleDateString())
        cy.get("button").should("be.disabled")
    })

    it("clears the selected date when the clear button is pressed", () => {
        const predefinedDate = new Date(2023, 0, 1)
        const handleChange = cy.stub().as("handleChange")
        const handleSubmit = cy.stub().as("handleSubmit")


        cy.mount(<TestForm
            initialValues={{ date: null }}
            onSubmit={handleSubmit}
            props={{
                name: "date",
                label: "Date",
                value: predefinedDate,
                onChange: handleChange
            }} />)

        cy.get("button").should("contain.text", predefinedDate.toLocaleDateString())

        cy.get("button svg").last().parent().click()
        cy.get("@handleChange").should("have.been.calledWith", null)
        cy.get("button").should("contain.text", "Select date...")
        cy.get("button").contains("Submit").click()

        cy.get("@handleSubmit").should("have.been.calledWith")
    })
})