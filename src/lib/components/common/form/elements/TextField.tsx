"use client"

import { FormikValues, useField, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { useFormFieldInit } from "@/src/lib/hooks/use-form-field-init"

export interface LabeledTextFieldProps<E, V> extends FormElementProps<E, V> {
    type?: "text" | "password" | "email" | "number" | "time"
}

export const TextField = <E, V>({ name, type = "text", ...props }: LabeledTextFieldProps<E, V>) => {
    const [input, , helpers] = useField(name as string)
    const { isSubmitting } = useFormikContext<FormikValues>()

    useFormFieldInit({
        fieldValue: input.value,
        propValue: props.value,
        defaultValue: null,
        helpers
    })

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
