import { FormatterBase } from "@/src/lib/util/formatter/Formatter"


export default class DateFormatter extends FormatterBase<Date, string, { long: boolean, onlyMonth: boolean }> {
    format(input: Date, options ?: { long?: boolean, onlyMonth?: boolean }): string {
        if (options?.onlyMonth) {
            return input.toLocaleDateString(this.context.locale, { month: "long", year: "numeric" })
        }
        return input.toLocaleDateString(this.context.locale, {
            dateStyle: options?.long ? "long" : "short"
        })
    }
}