"use client"

import React, { useEffect } from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { SelectField, SelectOption } from "@/src/lib/components/common/form/elements/SelectField"

export interface SelectFormFieldProps<TEntity, TValue> extends FormElementProps<TEntity, TValue> {
    options: SelectOption<TValue>[]
}

export const SelectFormField = <E, V = E[keyof E]>({
                                                       name,
                                                       options,
                                                       readonly,
                                                       onChange,
                                                       value,
                                                       ...props
                                                   }: SelectFormFieldProps<E, V>) => {
    const [field, , helpers] = useField<V | null>(name)
    const { isSubmitting } = useFormikContext()

    useEffect(() => {
        if (field.value === undefined) {
            helpers.setValue(null)
        }

        if (value && value !== field.value) {
            helpers.setValue(value)
        }
    }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (newValue: V | null) => {
        if (!readonly) {
            helpers.setValue(newValue)
        }
        onChange?.(newValue)
    }
    return (
        <FormElement name={name} {...props}>
            <SelectField
                options={options}
                value={field.value}
                onChange={handleChange}
                readonly={readonly || isSubmitting}
                {...props} />
        </FormElement>
    )
}

export default SelectFormField