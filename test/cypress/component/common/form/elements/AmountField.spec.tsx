import React from "react"
import { Form, Formik } from "formik"
import AmountField from "@/src/lib/components/common/form/elements/AmountField"
import { CurrentHouseholdContext } from "@/src/lib/components/provider/HouseholdProvider"
import { Household } from "@prisma/client"

interface TestObject {
    amount: number
}

describe("<AmountField />", () => {
    const mockHousehold: Partial<Household> = {
        currency: "EUR"
    }

    const TestForm = ({
                          initialValues = { amount: 0 },
                          onSubmit = () => {},
                          props,
                          household = mockHousehold
                      }: {
        initialValues?: { amount: number | null }
        onSubmit?: (values: any) => void
        props: React.ComponentProps<typeof AmountField<TestObject, number>>
        household?: Partial<Household>
    }) => (
        <CurrentHouseholdContext.Provider value={household as Household}>
            <Formik initialValues={initialValues} onSubmit={onSubmit}>
                <Form>
                    <AmountField<TestObject, number> {...props} />
                    <button type="submit">Submit</button>
                </Form>
            </Formik>
        </CurrentHouseholdContext.Provider>
    )

    it("renders with currency symbol and code (EUR)", () => {
        cy.mount(
            <TestForm
                props={{
                    name: "amount",
                    label: "Amount",
                }}
            />
        )

        // For EUR, symbol is €
        cy.contains("€").should("be.visible")
        cy.contains("EUR").should("be.visible")
    })

    it("renders with USD symbol and code", () => {
        cy.mount(
            <TestForm
                household={{ currency: "USD" } as Household}
                props={{
                    name: "amount",
                    label: "Amount",
                }}
            />
        )

        // For USD, symbol is $
        cy.contains("$").should("be.visible")
        cy.contains("USD").should("be.visible")
    })

    it("updates value when typed into", () => {
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <TestForm
                onSubmit={handleSubmit}
                props={{
                    name: "amount",
                    label: "Amount",
                }}
            />
        )

        cy.get("input").clear().type("123.45")
        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { amount: 123.45 })
    })
})
