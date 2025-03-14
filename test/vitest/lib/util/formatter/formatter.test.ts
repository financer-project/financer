import { describe, test, expect } from "vitest"
import { FormatterContext } from "@/src/lib/util/formatter/Formatter"
import AmountFormatter from "@/src/lib/util/formatter/AmountFormatter"
import CurrencyDescriptionFormatter from "@/src/lib/util/formatter/CurrencyDescriptionFormatter"
import DateFormatter from "@/src/lib/util/formatter/DateFormatter"
import currencyCodes from "currency-codes"

describe("Formatters", () => {
    const deContext: FormatterContext = {
        locale: "de-DE",
        currency: currencyCodes.code("EUR")!
    }

    const usContext: FormatterContext = {
        locale: "en-US",
        currency: currencyCodes.code("USD")!
    }

    describe("AmountFormatter", () => {
        test("formats amounts correctly with German settings", () => {
            const formatter = new AmountFormatter(deContext)
            expect(formatter.format(1234.56)).toBe("1.234,56 EUR")
            expect(formatter.format(-50)).toBe("-50,00 EUR")
            expect(formatter.format(0)).toBe("0,00 EUR")
        })

        test("formats amounts correctly with US settings", () => {
            const formatter = new AmountFormatter(usContext)
            expect(formatter.format(1234.56)).toBe("USD 1,234.56")
            expect(formatter.format(-50)).toBe("-USD 50.00")
            expect(formatter.format(0)).toBe("USD 0.00")
        })
    })

    describe("CurrencyDescriptionFormatter", () => {
        test("formats valid currencies correctly", () => {
            const formatter = new CurrencyDescriptionFormatter(deContext)
            expect(formatter.format("EUR")).toBe("Euro (EUR)")
            expect(formatter.format("USD")).toBe("US Dollar (USD)")
            expect(formatter.format("JPY")).toBe("Yen (JPY)")
        })

        test("returns unknown currencies unchanged", () => {
            const formatter = new CurrencyDescriptionFormatter(deContext)
            expect(formatter.format("XYZ")).toBe("XYZ")
            expect(formatter.format("")).toBe("")
        })
    })

    describe("DateFormatter", () => {
        test("formats date in short format", () => {
            const formatter = new DateFormatter(deContext)
            const date = new Date(2023, 5, 15) // June 15, 2023
            expect(formatter.format(date)).toMatch(/15\.06\.2023|15\.06\.23/)
        })

        test("formats date in long format", () => {
            const formatter = new DateFormatter(deContext)
            const date = new Date(2023, 5, 15) // June 15, 2023
            expect(formatter.format(date, { long: true })).toMatch(/15\. Juni 2023|Donnerstag, 15\. Juni 2023/)
        })

        test("formats only month and year", () => {
            const formatter = new DateFormatter(deContext)
            const date = new Date(2023, 5, 15) // June 15, 2023
            expect(formatter.format(date, { onlyMonth: true })).toBe("Juni 2023")
        })

        test("respects locale when formatting", () => {
            const deFormatter = new DateFormatter(deContext)
            const usFormatter = new DateFormatter(usContext)
            const date = new Date(2023, 5, 15) // June 15, 2023

            const deResult = deFormatter.format(date, { long: true })
            const usResult = usFormatter.format(date, { long: true })

            expect(deResult).toContain("Juni")
            expect(usResult).toContain("June")
        })
    })
})