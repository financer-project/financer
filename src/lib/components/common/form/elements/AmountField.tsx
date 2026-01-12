"use client"

import currencyCodes from "currency-codes"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/src/lib/components/ui/input-group"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { FormikValues, useField, useFormikContext } from "formik"

export const AmountField = <E, V = number>({ name, ...props }: FormElementProps<E, V>) => {
    const currentHousehold = useCurrentHousehold()
    const currency = currencyCodes.code(currentHousehold?.currency ?? "USD")!

    const [input, , helpers] = useField(name as string)
    const { isSubmitting } = useFormikContext<FormikValues>()

    return (
        <FormElement name={name} {...props}>
            <InputGroup>
                <InputGroupInput
                    {...input}
                    id={name.toString()}
                    type="text"
                    inputMode="numeric"
                    value={typeof input.value === "number" ? input.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) : ""}
                    disabled={isSubmitting || props.readonly}
                    placeholder={props.placeholder ?? "0.00"}
                    className={"text-right appearance-none items-center"}
                    onChange={event => {
                        const digits = event.target.value.replace(/\D/g, "")
                        if (digits === "") {
                            helpers.setValue(null)
                            props.onChange?.(null)
                        } else {
                            const amount = parseInt(digits, 10) / 100
                            helpers.setValue(amount)
                            props.onChange?.(amount as V)
                        }
                    }}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupText className={"mt-0.5"}>{currency.code}</InputGroupText>
                </InputGroupAddon>
            </InputGroup>
        </FormElement>
    )
}

export default AmountField
