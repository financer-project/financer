import { CurrencyCodeRecord } from "currency-codes"

export type FormatterContext = {
    locale: string;
    currency: CurrencyCodeRecord;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Formatter<TInput, TOutput, TOptions = {}> {
    format(input: TInput, options?: TOptions): TOutput;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export abstract class FormatterBase<TInput, TOutput, TOptions = {}> implements Formatter<TInput, TOutput, TOptions> {
    protected context: FormatterContext

    constructor(context: FormatterContext) {
        this.context = context
    }

    abstract format(input: TInput, options: TOptions): TOutput;
}

