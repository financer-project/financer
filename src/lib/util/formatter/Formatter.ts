import { CurrencyCodeRecord } from "currency-codes"

export type FormatterContext = {
    locale: string;
    currency: CurrencyCodeRecord;
}

export interface Formatter<TInput, TOutput, TOptions = {}> {
    format(input: TInput, options?: TOptions): TOutput;
}

export abstract class FormatterBase<TInput, TOutput, TOptions = {}> implements Formatter<TInput, TOutput, TOptions> {
    protected context: FormatterContext

    constructor(context: FormatterContext) {
        this.context = context
    }

    abstract format(input: TInput, options: TOptions): TOutput;
}

