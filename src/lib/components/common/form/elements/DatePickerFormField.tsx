"use client"

import React from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { DatePicker } from "@/src/lib/components/common/form/elements/DatePicker"
import { useFormFieldInit } from "@/src/lib/hooks/use-form-field-init"

export const DatePickerFormField = <E, >({
                                             name,
                                             readonly,
                                             onChange,
                                             ...props
                                         }: FormElementProps<E, Date>) => {
    const [field, , helpers] = useField<Date | null>(name as string)
    const { isSubmitting } = useFormikContext()

    useFormFieldInit({
        fieldValue: field.value,
        propValue: props.value,
        defaultValue: null,
        helpers
    })

    const handleChange = (newValue: Date | null) => {
        if (!readonly) {
            helpers.setValue(newValue)
            onChange?.(newValue)
        }
    }

    return (
        <FormElement name={name} {...props}>
            <DatePicker
                value={field.value}
                onChange={handleChange}
                readonly={readonly || isSubmitting}
                {...props}
            />
        </FormElement>
    )
}

export default DatePickerFormField