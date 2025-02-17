"use client"

import currencyCodes from "currency-codes"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Formatter, FormatterContext } from "@/src/lib/util/formatter/Formatter"
import React from "react"
import AmountFormatter from "@/src/lib/util/formatter/AmountFormatter"
import CurrencyDescriptionFormatter from "@/src/lib/util/formatter/CurrencyDescriptionFormatter"
import DateFormatter from "@/src/lib/util/formatter/DateFormatter"
import { useQuery } from "@blitzjs/rpc"
import getSetting from "@/src/lib/model/settings/queries/getSetting"

const getFormatters = (context: FormatterContext) => ({
    amount: new AmountFormatter(context),
    capitalize: { format: (str: string) => str.charAt(0).toUpperCase() + str.slice(1) } satisfies Formatter<string, string>,
    currencyDescription: new CurrencyDescriptionFormatter(context),
    date: new DateFormatter(context)
})

export interface WithFormattersProps {
    formatters: ReturnType<typeof getFormatters>
}

function withFormatters<T extends WithFormattersProps = WithFormattersProps>(WrappedComponent: React.ComponentType<T>) {
    const WithFormatters = (props: Omit<T, keyof WithFormattersProps>) => {
        const currentHousehold = useCurrentHousehold()
        const [settings] = useQuery(getSetting, {})

        const context: FormatterContext = {
            locale: settings?.language ?? "en-US",
            currency: currencyCodes.code(currentHousehold?.currency ?? "USD")!
        }
        const formatters = getFormatters(context)

        return (<WrappedComponent {...(props as T)} formatters={formatters} />)
    }
    WithFormatters.displayName = "WithFormatters"
    return WithFormatters;
}

export default withFormatters