import { FormatterBase } from "@/src/lib/util/formatter/Formatter"

export interface DateFormatOptions {
    long?: boolean
    onlyMonth?: boolean
    withTime?: boolean
}

export default class DateFormatter extends FormatterBase<Date, string, DateFormatOptions> {
    format(input: Date, options?: DateFormatOptions): string {
        if (options?.onlyMonth) {
            return input.toLocaleDateString(this.context.locale, { month: "long", year: "numeric" })
        }

        if (options?.withTime) {
            return input.toLocaleString(this.context.locale, {
                dateStyle: options?.long ? "long" : "short",
                timeStyle: "short"
            })
        }

        return input.toLocaleDateString(this.context.locale, {
            dateStyle: options?.long ? "long" : "short"
        })
    }
}