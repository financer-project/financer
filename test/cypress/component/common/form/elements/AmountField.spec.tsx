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

        cy.get("input").clear().type("12345")
        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { amount: 123.45 })
    })

    it("shifts digits from right to left as they are typed (ATM style)", () => {
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

        cy.get("input").clear().type("5")
        // Use a regex to match both . and , as decimal separator to be locale-agnostic if needed,
        // but since previous tests used ".", we'll stick to it or match both.
        cy.get("input").should("have.value", "0.05")

        cy.get("input").type("0")
        cy.get("input").should("have.value", "0.50")

        cy.get("input").type("5")
        cy.get("input").should("have.value", "5.05")

        cy.get("input").type("0")
        cy.get("input").should("have.value", "50.50")

        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { amount: 50.5 })
    })

    it("shifts digits from right to left as they are typed (ATM style)", () => {
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

        cy.get("input").clear().type("5")
        // Use a regex to match both . and , as decimal separator to be locale-agnostic if needed,
        // but since previous tests used ".", we'll stick to it or match both.
        cy.get("input").should("have.value", "0.05")

        cy.get("input").type("0")
        cy.get("input").should("have.value", "0.50")

        cy.get("input").type("5")
        cy.get("input").should("have.value", "5.05")

        cy.get("input").type("0")
        cy.get("input").should("have.value", "50.50")

        cy.get("button[type='submit']").click()
        cy.get("@handleSubmit").should("have.been.calledWith", { amount: 50.5 })
    })
})
