import { FormatterBase } from "@/src/lib/util/formatter/Formatter"

export default class DateFormatter extends FormatterBase<Date, string, { long: boolean }> {
    format(input: Date, options?: { long?: boolean }): string {
        return input.toLocaleDateString(this.context.locale, {
            dateStyle: options?.long ? "long" : "short"
        })
    }
}