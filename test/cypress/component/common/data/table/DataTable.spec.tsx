import React from "react"
import { DataTable, FilterConfig, TableColumn } from "@/src/lib/components/common/data/table"

type Row = { id: string; name: string; categoryId?: string; accountId?: string }

const sampleData: Row[] = [
    { id: "1", name: "Alpha", categoryId: "cat-a", accountId: "acc-1" },
    { id: "2", name: "Beta", categoryId: "cat-b", accountId: "acc-2" }
]

const columns: TableColumn<Row>[] = [
    { name: "Name", render: (r) => r.name, isKey: true }
]

const filters: FilterConfig<Row>[] = [
    {
        type: "select",
        label: "Account",
        property: "accountId",
        multiSelect: true,
        options: [
            { label: "Acc One", value: "acc-1" },
            { label: "Acc Two", value: "acc-2" },
            { label: "Acc Three", value: "acc-3" }
        ]
    },
    {
        type: "select",
        label: "Category",
        property: "categoryId",
        options: [
            { label: "Cat A", value: "cat-a" },
            { label: "Cat B", value: "cat-b" },
            { label: "Cat C", value: "cat-c" }
        ]
    }
]

describe("<DataTable />", () => {
    beforeEach(() => {
        cy.viewport(1000, 800)
    })

    describe("Rendering", () => {
        it("renders rows, columns and toolbar with filters", () => {
            cy.mount(
                <DataTable<Row>
                    data={sampleData}
                    columns={columns}
                    hasMore={false}
                    filters={filters}
                />
            )

            // Columns header
            cy.contains("th", "Name").should("exist")

            // Rows content
            cy.contains("td", "Alpha").should("exist")
            cy.contains("td", "Beta").should("exist")

            // Toolbar should render two select filters (multi + single)
            cy.get("[role='select-field']").should("have.length", 2)
            cy.get("[role='select-field']").eq(0).should("contain.text", "Account")
            cy.get("[role='select-field']").eq(1).should("contain.text", "Category")
        })
    })

    describe("Toolbar", () => {
        describe("String filter", () => {
            it("renders a string filter input with label as placeholder and accepts typing", () => {
                const stringFilters: FilterConfig<Row>[] = [
                    { type: "string", label: "Search Name", property: "name" }
                ]

                cy.mount(
                    <DataTable<Row>
                        data={sampleData}
                        columns={columns}
                        hasMore={false}
                        filters={stringFilters}
                    />
                )

                // Input should be present with placeholder
                cy.get("input[placeholder='Search Name']").should("exist").as("strInput")

                // Type text and ensure value is reflected immediately
                cy.get("@strInput").type("alph").should("have.value", "alph")
            })
        })
        describe("Select filters", () => {
            it("opens multi-select filter and shows all options", () => {
                cy.mount(
                    <DataTable<Row>
                        data={sampleData}
                        columns={columns}
                        hasMore={false}
                        filters={filters}
                    />
                )

                // Open the first (multi) select
                cy.get("[role='select-field']").eq(0).click()

                // Dialog with listbox and options should be visible
                cy.get("div[role='dialog']").should("be.visible")
                cy.get("div[role='listbox']").find("div[role='option']").should("have.length", 3)
            })

            it("selects from single-select filter and reflects chosen label", () => {
                cy.mount(
                    <DataTable<Row>
                        data={sampleData}
                        columns={columns}
                        hasMore={false}
                        filters={filters}
                    />
                )

                // Open the second (single) select
                cy.get("[role='select-field']").eq(1).click()
                cy.get("div[role='dialog']").should("be.visible")

                // Pick first option
                cy.get("div[role='listbox'] div div:first-child").click()

                // The select field should now show the selected label
                cy.get("[role='select-field']").eq(1).should("contain.text", "Cat A")
            })

            it("selects multiple options in multi-select and shows selection count", () => {
                cy.mount(
                    <DataTable<Row>
                        data={sampleData}
                        columns={columns}
                        hasMore={false}
                        filters={filters}
                    />
                )

                // Open multi-select and select two options
                cy.get("[role='select-field']").eq(0).click()
                cy.get("div[role='listbox'] div div").eq(0).click()
                cy.get("div[role='listbox'] div div").eq(1).click()

                // Close the popover by clicking outside (click body)
                cy.get("body").click(0, 0)

                // Expect label to indicate two selected
                cy.get("[role='select-field']").eq(0).should("contain.text", "Acc One")
                cy.get("[role='select-field']").eq(0).should("contain.text", "Acc Two")
            })
        })
    })

    describe("Pagination", () => {
        describe("Visibility and state", () => {
            it("hides pagination when hasMore=false and page=0 (default)", () => {
                cy.mount(
                    <DataTable<Row>
                        data={sampleData}
                        columns={columns}
                        hasMore={false}
                        filters={filters}
                    />
                )

                // Container is rendered but hidden; buttons should not be visible
                cy.contains("button", "Previous").should("not.be.visible")
                cy.contains("button", "Next").should("not.be.visible")
            })

            it("shows pagination with Next enabled when hasMore=true and page=0", () => {
                cy.mount(
                    <DataTable<Row>
                        data={sampleData}
                        columns={columns}
                        hasMore={true}
                        filters={filters}
                    />
                )

                cy.contains("button", "Previous").should("be.visible").and("be.disabled")
                cy.contains("button", "Next").should("be.visible").and("not.be.disabled")
            })
        })
    })
})
