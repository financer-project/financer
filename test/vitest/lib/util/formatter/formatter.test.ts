import { describe, expect, test } from "vitest"
import { FormatterContext } from "@/src/lib/util/formatter/Formatter"
import AmountFormatter from "@/src/lib/util/formatter/AmountFormatter"
import CurrencyDescriptionFormatter from "@/src/lib/util/formatter/CurrencyDescriptionFormatter"
import DateFormatter from "@/src/lib/util/formatter/DateFormatter"
import UserFormatter from "@/src/lib/util/formatter/UserFormatter"
import { formatFileSize } from "@/src/lib/util/formatter/FileSizeFormatter"
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

    describe("UserFormatter", () => {
        test("formats a user as 'firstName lastName'", () => {
            const formatter = new UserFormatter(deContext)
            expect(formatter.format({ firstName: "Ada", lastName: "Lovelace" })).toBe("Ada Lovelace")
        })

        test("does not swap or drop name parts", () => {
            const formatter = new UserFormatter(usContext)
            expect(formatter.format({ firstName: "Grace", lastName: "Hopper" })).toBe("Grace Hopper")
            expect(formatter.format({ firstName: "Grace", lastName: "Hopper" })).not.toBe("Hopper Grace")
        })
    })

    describe("formatFileSize", () => {
        test("formats zero bytes as '0 B' regardless of decimals", () => {
            expect(formatFileSize(0)).toBe("0 B")
        })

        test("formats zero bytes using a forced unit label", () => {
            expect(formatFileSize(0, { unit: "MB" })).toBe("0 MB")
        })

        test("auto-selects bytes for values under 1024", () => {
            expect(formatFileSize(500)).toBe("500.0 B")
        })

        test("auto-selects KB for values in the kilobyte range", () => {
            expect(formatFileSize(1536)).toBe("1.5 KB")
        })

        test("auto-selects MB for values in the megabyte range", () => {
            expect(formatFileSize(1024 * 1024)).toBe("1.0 MB")
        })

        test("clamps auto-selection at TB for extremely large values", () => {
            // 1024^6 bytes is mathematically "EB" scale, but UNITS tops out at TB (index 4);
            // the Math.min clamp must keep the unit at TB rather than indexing out of bounds.
            expect(formatFileSize(Math.pow(1024, 6))).toBe("1048576.0 TB")
        })

        test("respects a forced unit even when it does not match the auto-selected one", () => {
            expect(formatFileSize(2048, { unit: "KB" })).toBe("2.0 KB")
            expect(formatFileSize(2048, { unit: "B" })).toBe("2048.0 B")
        })

        test("respects a custom decimals option on both the auto and forced-unit paths", () => {
            expect(formatFileSize(1234, { decimals: 2 })).toBe("1.21 KB")
            expect(formatFileSize(1234, { decimals: 0, unit: "KB" })).toBe("1 KB")
        })
    })
})