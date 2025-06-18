"use client"

import { useEffect } from "react"
import { FormikValues, useField, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface LabeledTextFieldProps<E, V> extends FormElementProps<E, V> {
    type?: "text" | "password" | "email" | "number"
}

export const TextField = <E, V>({ name, type = "text", ...props }: LabeledTextFieldProps<E, V>) => {
    const [input, , helpers] = useField(name)
    const { isSubmitting } = useFormikContext<FormikValues>()

    useEffect(() => {
        if (input.value === undefined) {
            helpers.setValue(null)
        }

        if (props.value && props.value !== input.value) {
            helpers.setValue(props.value)
        }
    }, [props.value]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <FormElement name={name} {...props}>
            <Input {...input}
                   id={name.toString()}
                   disabled={isSubmitting || props.readonly}
                   type={type}
                   placeholder={props.placeholder}
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
                   }} />
        </FormElement>
    )
}

export default TextField
