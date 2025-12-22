import React from "react"
import { Form, Formik } from "formik"
import PasswordField from "@/src/lib/components/common/form/elements/PasswordField"

interface TestObject {
    password: string
}

describe("<PasswordField />", () => {
    const TestForm = ({
                          initialValues = { password: "" },
                          onSubmit = () => {},
                          props
                      }: {
        initialValues?: { password: string | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof PasswordField<TestObject, string>>
    }) => (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            <Form>
                <PasswordField<TestObject, string> {...props} />
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )

    it("renders as password type initially", () => {
        cy.mount(
            <TestForm
                props={{
                    name: "password",
                    label: "Password",
                }}
            />
        )

        cy.get("input").should("have.attr", "type", "password")
    })

    it("toggles password visibility", () => {
        cy.mount(
            <TestForm
                props={{
                    name: "password",
                    label: "Password",
                }}
            />
        )

        cy.get("input").should("have.attr", "type", "password")
        cy.get("button[aria-label='Show password']").click()
        cy.get("input").should("have.attr", "type", "text")
        cy.get("button[aria-label='Hide password']").click()
        cy.get("input").should("have.attr", "type", "password")
    })

    it("updates value when typed into", () => {
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                onSubmit={handleSubmit}
                props={{
                    name: "password",
                    label: "Password",
                }}
            />
        )

        cy.get("input").type("secret123")
        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { password: "secret123" })
    })
})
