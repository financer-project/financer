import { FormatterBase } from "./Formatter"
import currencyCodes from "currency-codes"

export default class CurrencyDescriptionFormatter extends FormatterBase<string, string> {
    format(input: string) {
        const currency = currencyCodes.code(input)
        if (!currency) {
            return input
        }
        return `${currency.currency} (${currency.code})`
    }
}

