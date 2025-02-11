"use client"

import currencyCodes from "currency-codes"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Formatter, FormatterContext } from "@/src/lib/util/formatter/Formatter"
import React from "react"
import AmountFormatter from "@/src/lib/util/formatter/AmountFormatter"
import CurrencyDescriptionFormatter from "@/src/lib/util/formatter/CurrencyDescriptionFormatter"

const getFormatters = (context: FormatterContext) => ({
    currencyDescription: new CurrencyDescriptionFormatter(context),
    amount: new AmountFormatter(context),
    capitalize: { format: (str: string) => str.charAt(0).toUpperCase() + str.slice(1) } satisfies Formatter<string, string>
})

export interface WithFormattersProps {
    formatters: ReturnType<typeof getFormatters>
}

function withFormatters<T extends WithFormattersProps = WithFormattersProps>(WrappedComponent: React.ComponentType<T>) {
    return (props: Omit<T, keyof WithFormattersProps>) => {
        const currentHousehold = useCurrentHousehold()

        const context: FormatterContext = {
            locale: "en-US",
            currency: currencyCodes.code(currentHousehold?.currency ?? "USD")!
        }
        const formatters = getFormatters(context)

        return (<WrappedComponent {...(props as T)} formatters={formatters} />)
    }
}

export default withFormatters