import React from "react"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"

describe("<SelectField />", () => {
    it("select an option", () => {
        cy.mount(<SelectField<string>
            options={[
                { value: "first", label: "First" },
                { value: "second", label: "Second" },
                { value: "third", label: "Third" }]} />)

        cy.get("button").should("contain.text", "Select option ...")

        cy.get("button").click()
        cy.get("div[role='dialog']").should("be.visible")
        cy.get("div[role='listbox'] div").children().should("have.length", 3)

        cy.get("div[role='listbox'] div div:first-child").click()
        cy.get("button").should("contain.text", "First")
    })


    it("select a predefined value", () => {
        cy.mount(<SelectField<string>
            options={[
                { value: "first", label: "First" },
                { value: "second", label: "Second" },
                { value: "third", label: "Third" }]}
            value="second"
        />)

        cy.get("button").should("contain.text", "Second")
    })


    it("renders with readOnly property set to true", () => {
        cy.mount(<SelectField<string>
            options={[
                { value: "first", label: "First" },
                { value: "second", label: "Second" },
                { value: "third", label: "Third" }]}
            value="third"
            readonly={true}
        />)

        cy.get("button").should("contain.text", "Third")
        cy.get("button").should("have.attr", "disabled")
    })


    it("clears the selected value when the clear button is pressed", () => {
        cy.mount(<SelectField<string>
            options={[
                { value: "first", label: "First" },
                { value: "second", label: "Second" },
                { value: "third", label: "Third" }]}
        />)

        cy.get("button").click()
        cy.get("div[role='listbox'] div div:first-child").click()
        cy.get("button").should("contain.text", "First")

        cy.get("button svg").parent().click()
        cy.get("button").should("contain.text", "Select option ...")
    })
})