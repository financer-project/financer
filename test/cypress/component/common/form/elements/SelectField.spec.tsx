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

            cy.get("[role='select-field']").should("contain.text", "Select option ...")

            cy.get("[role='select-field']").click()
            cy.get("div[role='dialog']").should("be.visible")
            cy.get("div[role='listbox']").find("div[role='option']").should("have.length", 3)

            cy.get("div[role='listbox'] div div:first-child").click()
            cy.get("[role='select-field']").should("contain.text", "First")
        })

        it("select a predefined value", () => {
            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
                value="second" />)

            cy.get("[role='select-field']").should("contain.text", "Second")
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

            cy.get("[role='select-field']").should("contain.text", "Select option ...")

            cy.wait(500).then(() => {
                setData("second") // Update value dynamically
                cy.get("[role='select-field']").should("contain.text", "Second")
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

            cy.get("[role='select-field']").should("contain.text", "Third")
            cy.get("[role='select-field']").should("have.class", "pointer-events-none")
        })

        it("clears the selected value when the clear button is pressed", () => {
            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" }]}
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='listbox'] div div:first-child").click()
            cy.get("[role='select-field']").should("contain.text", "First")

            cy.get("[role='select-field'] button").click()
            cy.get("[role='select-field']").should("contain.text", "Select option ...")
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

            cy.get("[role='select-field']").should("contain.text", "Select option ...")

            // Select first option
            cy.get("[role='select-field']").click()
            cy.get("div[role='listbox'] div div:first-child").click()
            cy.get("@handleChange").should("have.been.calledWith", ["first"])

            // Select second option (dropdown stays open in multiple mode)
            cy.get("div[role='listbox'] div div:nth-child(2)").click()
            cy.get("@handleChange").should("have.been.calledWith", ["first", "second"])

            // Verify both options are displayed
            cy.get("[role='select-field']").should("contain.text", "First")
            cy.get("[role='select-field']").should("contain.text", "Second")
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
            cy.get("[role='select-field']").should("contain.text", "First")
            cy.get("[role='select-field']").should("contain.text", "Second")

            // Deselect first option
            cy.get("[role='select-field']").eq(0).click()
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

            cy.get("[role='select-field']").should("contain.text", "First")
            cy.get("[role='select-field']").should("contain.text", "Third")
            cy.get("[role='select-field']").should("not.contain.text", "Second")
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

            cy.get("[role='select-field']").should("contain.text", "First")
            cy.get("[role='select-field']").should("contain.text", "Second")

            cy.get("[role='select-field'] button").click()
            cy.get("@handleChange").should("have.been.calledWith", [])
            cy.get("[role='select-field']").should("contain.text", "Select option ...")
        })

        it("respects keepPlaceholder property", () => {
            cy.mount(<SelectField<string>
                options={[{ value: "first", label: "First" },
                    { value: "second", label: "Second" },
                    { value: "third", label: "Third" },
                    { value: "fourth", label: "Fourth" }
                ]}
                multiple
                keepPlaceholder
                value={["first"]}
            />)

            cy.get("[role='select-field']").should("contain.text", "Select option ...")
            cy.get("[role='select-field']").should("contain.text", "First")

            cy.get("[role='select-field']").eq(0).click()
            cy.get("div[role='listbox'] div div:nth-child(2)").click()
            cy.get("div[role='listbox'] div div:nth-child(3)").click()
            cy.get("div[role='listbox'] div div:nth-child(4)").click()

            cy.get("[role='select-field']").should("contain.text", "4 selected")
        })

        it("respects disableClearButton property", () => {
            cy.mount(<SelectField<string>
                options={[{ value: "first", label: "First" }]}
                disableClearButton={true}
                value="first"
            />)

            cy.get("[role='select-field']").should("contain.text", "First")
            cy.get("[role='select-field'] button").should("not.exist")
        })
    })

    // Create new functionality tests
    describe("Create New", () => {
        it("shows 'Create new...' option when onCreateNew is provided", () => {
            const handleCreateNew = cy.stub().as("handleCreateNew")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" }
                ]}
                onCreateNew={handleCreateNew}
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='dialog']").should("be.visible")
            cy.get("div[role='listbox']").should("contain.text", "Create new...")
        })

        it("uses custom createNewLabel when provided", () => {
            const handleCreateNew = cy.stub().as("handleCreateNew")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" }
                ]}
                onCreateNew={handleCreateNew}
                createNewLabel="Add new item..."
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='dialog']").should("be.visible")
            cy.get("div[role='listbox']").should("contain.text", "Add new item...")
            cy.get("div[role='listbox']").should("not.contain.text", "Create new...")
        })

        it("calls onCreateNew callback when clicking 'Create new...'", () => {
            const handleCreateNew = cy.stub().as("handleCreateNew")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" }
                ]}
                onCreateNew={handleCreateNew}
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='listbox']").contains("Create new...").click()

            cy.get("@handleCreateNew").should("have.been.calledOnce")
        })

        it("closes the dropdown after clicking 'Create new...'", () => {
            const handleCreateNew = cy.stub().as("handleCreateNew")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" }
                ]}
                onCreateNew={handleCreateNew}
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='dialog']").should("be.visible")

            cy.get("div[role='listbox']").contains("Create new...").click()
            cy.get("div[role='dialog']").should("not.exist")
        })

        it("does not show 'Create new...' option when onCreateNew is not provided", () => {
            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" }
                ]}
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='dialog']").should("be.visible")
            cy.get("div[role='listbox']").should("not.contain.text", "Create new...")
        })

        it("works with multiple selection mode", () => {
            const handleCreateNew = cy.stub().as("handleCreateNew")

            cy.mount(<SelectField<string>
                options={[
                    { value: "first", label: "First" },
                    { value: "second", label: "Second" }
                ]}
                multiple={true}
                onCreateNew={handleCreateNew}
            />)

            cy.get("[role='select-field']").click()
            cy.get("div[role='dialog']").should("be.visible")
            cy.get("div[role='listbox']").should("contain.text", "Create new...")

            cy.get("div[role='listbox']").contains("Create new...").click()
            cy.get("@handleCreateNew").should("have.been.calledOnce")
        })
    })
})
