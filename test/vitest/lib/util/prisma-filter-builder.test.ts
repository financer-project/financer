import { describe, expect, it } from "vitest"
import { buildPrismaWhere } from "@/src/lib/components/common/data/table/filters/prisma-filter-builder"
import {
    DateFilterConfig,
    SelectFilterConfig,
    StringFilterConfig
} from "@/src/lib/components/common/data/table/filters/types"

describe("buildPrismaWhere", () => {
    it("returns empty object when no filters or search provided", () => {
        const result = buildPrismaWhere({
            searchParams: new URLSearchParams(),
            filters: []
        })
        expect(result).toEqual({})
    })

    describe("StringFilterStrategy", () => {
        it("builds contains clause for string filter", () => {
            const filters: StringFilterConfig<any>[] = [{
                label: "Name",
                property: "name",
                type: "string"
            }]
            const searchParams = new URLSearchParams("name=Alice")

            const result = buildPrismaWhere({ searchParams, filters })

            expect(result).toEqual({
                AND: [
                    { name: { contains: "Alice" } }
                ]
            })
        })

        it("ignores empty value", () => {
            const filters: StringFilterConfig<any>[] = [{
                label: "Name",
                property: "name",
                type: "string"
            }]
            const searchParams = new URLSearchParams("name=")

            const result = buildPrismaWhere({ searchParams, filters })

            expect(result).toEqual({})
        })
    })

    describe("SelectFilterStrategy", () => {
        it("builds equals clause for single select", () => {
            const filters: SelectFilterConfig<any>[] = [{
                label: "Status",
                property: "status",
                type: "select",
                options: [{ label: "Active", value: "ACTIVE" }]
            }]
            const searchParams = new URLSearchParams("status=ACTIVE")

            const result = buildPrismaWhere({ searchParams, filters })

            expect(result).toEqual({
                AND: [
                    { status: { equals: "ACTIVE" } }
                ]
            })
        })

        it("builds in clause for multi select", () => {
            const filters: SelectFilterConfig<any>[] = [{
                label: "Status",
                property: "status",
                type: "select",
                multiSelect: true,
                options: []
            }]
            const searchParams = new URLSearchParams("status=ACTIVE,PENDING")

            const result = buildPrismaWhere({ searchParams, filters })

            expect(result).toEqual({
                AND: [
                    { status: { in: ["ACTIVE", "PENDING"] } }
                ]
            })
        })

        it("builds in clause for single select with comma separated values (legacy behavior or manual url manipulation)", () => {
             const filters: SelectFilterConfig<any>[] = [{
                label: "Status",
                property: "status",
                type: "select",
                // multiSelect is false by default
                options: []
            }]
            const searchParams = new URLSearchParams("status=ACTIVE,PENDING")

            const result = buildPrismaWhere({ searchParams, filters })

            expect(result).toEqual({
                AND: [
                    { status: { in: ["ACTIVE", "PENDING"] } }
                ]
            })
        })
    })

    describe("DateFilterStrategy", () => {
        it("builds range clause for date filter", () => {
            const filters: DateFilterConfig<any>[] = [{
                label: "Date",
                property: "createdAt",
                type: "date"
            }]
            // 2023-01-01 to 2023-01-31
            const searchParams = new URLSearchParams("createdAt=2023-01-01..2023-01-31")

            const result = buildPrismaWhere({ searchParams, filters })

            // Note: The actual values will be Date objects.
            // We expect them to be parsed correctly.
            const andClauses = (result as any).AND
            expect(andClauses).toHaveLength(1)
            const clause = andClauses[0].createdAt

            expect(clause.gte).toBeInstanceOf(Date)
            expect(clause.lte).toBeInstanceOf(Date)
            
            // parseISO("2023-01-01") creates a date at local midnight.
            // We compare with new Date(2023, 0, 1) which is also local midnight.
            expect(clause.gte).toEqual(new Date(2023, 0, 1))
            expect(clause.lte).toEqual(new Date(2023, 0, 31))
        })

        it("handles open start range", () => {
            const filters: DateFilterConfig<any>[] = [{
                label: "Date",
                property: "createdAt",
                type: "date"
            }]
            const searchParams = new URLSearchParams("createdAt=..2023-01-31")

            const result = buildPrismaWhere({ searchParams, filters })

            const andClauses = (result as any).AND
            const clause = andClauses[0].createdAt

            expect(clause.gte).toBeUndefined()
            expect(clause.lte).toBeInstanceOf(Date)
        })

        it("handles open end range", () => {
            const filters: DateFilterConfig<any>[] = [{
                label: "Date",
                property: "createdAt",
                type: "date"
            }]
            const searchParams = new URLSearchParams("createdAt=2023-01-01..")

            const result = buildPrismaWhere({ searchParams, filters })

            const andClauses = (result as any).AND
            const clause = andClauses[0].createdAt

            expect(clause.gte).toBeInstanceOf(Date)
            expect(clause.lte).toBeUndefined()
        })
    })

    describe("Fuzzy Search", () => {
        it("builds OR clause for search fields", () => {
            const search = {
                fields: ["name", "description", "user.email"]
            }
            const searchParams = new URLSearchParams("q=term")

            const result = buildPrismaWhere({ searchParams, search })

            expect(result).toEqual({
                AND: [
                    {
                        OR: [
                            { name: { contains: "term" } },
                            { description: { contains: "term" } },
                            { user: { is: { email: { contains: "term" } } } }
                        ]
                    }
                ]
            })
        })

        it("ignores empty search term", () => {
             const search = {
                fields: ["name"]
            }
            const searchParams = new URLSearchParams("q=")

            const result = buildPrismaWhere({ searchParams, search })

            expect(result).toEqual({})
        })
    })

    it("combines filters and search", () => {
        const filters: StringFilterConfig<any>[] = [{
            label: "Category",
            property: "category",
            type: "string"
        }]
        const search = {
            fields: ["name"]
        }
        const searchParams = new URLSearchParams("category=Food&q=Lunch")

        const result = buildPrismaWhere({ searchParams, filters, search })

        expect(result).toEqual({
            AND: [
                { OR: [{ name: { contains: "Lunch" } }] },
                { category: { contains: "Food" } }
            ]
        })
    })
})
