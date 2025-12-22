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
                    type="number"
                    disabled={isSubmitting || props.readonly}
                    placeholder={props.placeholder ?? "0.00"}
                    className={"text-right"}
                    onChange={event => {
                        if (event.target.value === "") {
                            helpers.setValue(null)
                            props.onChange?.(null)
                        } else {
                            input.onChange(event)
                            if (event.target.value) {
                                props.onChange?.(event.target.value as V)
                            }
                        }
                    }}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupText>{currency.code}</InputGroupText>
                </InputGroupAddon>
            </InputGroup>
        </FormElement>
    )
}

export default AmountField
