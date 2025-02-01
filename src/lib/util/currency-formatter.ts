import { Formatter } from "./Formatter"
import currencyCodes from "currency-codes"

export const CurrencyDescriptionFormatter: Formatter<string, string> = {
    format: (input: string) => {
        const currency = currencyCodes.code(input)
        if (!currency) {
            return input
        }
        return `${currency.currency} (${currency.code})`
    }
}