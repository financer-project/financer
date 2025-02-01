import { CurrencyDescriptionFormatter } from "@/src/lib/util/currency-formatter"

export interface Formatter<TInput, TOutput> {
    format(input: TInput): TOutput;
}

export const Formatters = {
    currencyDescription: CurrencyDescriptionFormatter
}