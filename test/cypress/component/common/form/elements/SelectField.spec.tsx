import React from "react"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"

describe("<SelectField />", () => {
    // Single selection tests
    describe("Single Selection", () => {
        it("select an option", () => {
            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]} />)

            cy.get("button").should("contain.text", "Select option ...")

            cy.get("button").click()
            cy.get("div[role='dialog']").should("be.visible")
            cy.get("div[role='listbox']").find("div[role='option']").should("have.length", 3)

            cy.get("div[role='listbox'] div div:first-child").click()
            cy.get("button").should("contain.text", "First")
        })

        it("select a predefined value", () => {
            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
                value="second" />)

            cy.get("button").should("contain.text", "Second")
        })

        it("select with a value binding", () => {
            let data: string | null = null
            const setData = (newValue: string | null) => {
                data = newValue
                cy.mount(
                    <SelectField<string>
                        options={[
                            { value: "first", label: "First" },
                            { value: "second", label: "Second" },
                            { value: "third", label: "Third" }
                        ]}
                        value={data}
                        onChange={(value) => setData(value)}
                    />
                )
            }

            setData(null)

            cy.get("button").should("contain.text", "Select option ...")

            cy.wait(500).then(() => {
                setData("second") // Update value dynamically
                cy.get("button").should("contain.text", "Second")
            })
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

    // Multiple selection tests
    describe("Multiple Selection", () => {
        it("selects multiple options", () => {
            const handleChange = cy.stub().as("handleChange")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
                multiple={true}
                onChange={handleChange}
            />)

            cy.get("button").should("contain.text", "Select option ...")

            // Select first option
            cy.get("button").click()
            cy.get("div[role='listbox'] div div:first-child").click()
            cy.get("@handleChange").should("have.been.calledWith", ["first"])

            // Select second option (dropdown stays open in multiple mode)
            cy.get("div[role='listbox'] div div:nth-child(2)").click()
            cy.get("@handleChange").should("have.been.calledWith", ["first", "second"])

            // Verify both options are displayed
            cy.get("button").should("contain.text", "First")
            cy.get("button").should("contain.text", "Second")
        })

        it("deselects an option from multiple selections", () => {
            const handleChange = cy.stub().as("handleChange")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
                multiple={true}
                value={["first", "second"]}
                onChange={handleChange}
            />)

            // Verify initial state
            cy.get("button").should("contain.text", "First")
            cy.get("button").should("contain.text", "Second")

            // Deselect first option
            cy.get("button").eq(0).click()
            cy.get("div[role='listbox'] div div:first-child").click()
            cy.get("@handleChange").should("have.been.calledWith", ["second"])
        })

        it("initializes with multiple values", () => {
            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
                multiple={true}
                value={["first", "third"]}
            />)

            cy.get("button").should("contain.text", "First")
            cy.get("button").should("contain.text", "Third")
            cy.get("button").should("not.contain.text", "Second")
        })

        it("clears all selected values when the clear button is pressed", () => {
            const handleChange = cy.stub().as("handleChange")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
                multiple={true}
                value={["first", "second"]}
                onChange={handleChange}
            />)

            cy.get("button").should("contain.text", "First")
            cy.get("button").should("contain.text", "Second")

            cy.get("button svg").parent().click()
            cy.get("@handleChange").should("have.been.calledWith", [])
            cy.get("button").should("contain.text", "Select option ...")
        })
    })
})
