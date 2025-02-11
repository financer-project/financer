import { FormatterBase } from "@/src/lib/util/formatter/Formatter"

export default class AmountFormatter extends FormatterBase<number, string> {
    format(input: number): string {
        return Intl.NumberFormat(this.context.locale, {
            style: "currency",
            currency: this.context.currency.code,
            currencySign: "standard",
            currencyDisplay: "code"
        }).format(input)
    }
}