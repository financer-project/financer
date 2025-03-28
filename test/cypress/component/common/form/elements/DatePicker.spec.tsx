import React from "react"
import { DatePicker } from "@/src/lib/components/common/form/elements/DatePicker"
import { DateTime } from "luxon"

describe("<DatePicker />", () => {
    it("selects a date", () => {
        cy.mount(<DatePicker onChange={cy.stub().as("onChange")} />)

        cy.get("button").should("contain.text", "Select date...")

        cy.get("button").click()
        cy.get("[role='dialog']").should("be.visible")
        cy.get("td button").contains("1").click()

        cy.get("button").should("contain.text", DateTime.now().startOf("month").toJSDate().toLocaleDateString())
        cy.get("@onChange").should("have.been.called")
    })

    it("renders with a predefined value", () => {
        const predefinedDate = new Date(2023, 0, 1)
        cy.mount(<DatePicker value={predefinedDate} onChange={cy.stub()} />)

        cy.get("button").should("contain.text", predefinedDate.toLocaleDateString())
    })

    it("renders with readOnly property set to true", () => {
        const predefinedDate = new Date(2023, 0, 1)
        cy.mount(<DatePicker value={predefinedDate} readonly={true} onChange={cy.stub()} />)

        cy.get("button").should("contain.text", predefinedDate.toLocaleDateString())
        cy.get("button").should("be.disabled")
    })

    it("clears the selected date when the clear button is pressed", () => {
        const predefinedDate = new Date(2023, 0, 1)
        cy.mount(<DatePicker value={predefinedDate} onChange={cy.stub().as("onChange")} />)

        cy.get("button").should("contain.text", predefinedDate.toLocaleDateString())

        cy.get("button").parent().find("button").last().click()
        cy.get("@onChange").should("have.been.called")
        cy.get("button").should("contain.text", "Select date...")
    })
})