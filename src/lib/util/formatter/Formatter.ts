import { CurrencyCodeRecord } from "currency-codes"

export type FormatterContext = {
    locale: string;
    currency: CurrencyCodeRecord;
}

export interface Formatter<TInput, TOutput> {
    format(input: TInput): TOutput;
}

export abstract class FormatterBase<TInput, TOutput> implements Formatter<TInput, TOutput> {
    protected context: FormatterContext

    constructor(context: FormatterContext) {
        this.context = context
    }

    abstract format(input: TInput): TOutput;
}

