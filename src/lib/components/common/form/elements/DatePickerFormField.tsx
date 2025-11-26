"use client"

import React, { useEffect } from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { DatePicker } from "@/src/lib/components/common/form/elements/DatePicker"

export const DatePickerFormField = <E, >({
                                             name,
                                             readonly,
                                             onChange,
                                             ...props
                                         }: FormElementProps<E, Date>) => {
    const [field, , helpers] = useField<Date | null>(name as string)
    const { isSubmitting } = useFormikContext()

    useEffect(() => {
        if (field.value === undefined) {
            helpers.setValue(null)
        }

        if (props.value && props.value !== field.value) {
            helpers.setValue(props.value)
        }
    }, [props.value]) // eslint-disable-line react-hooks/exhaustive-deps

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