"use client"

import React, { useEffect } from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { SelectField, SelectOption } from "@/src/lib/components/common/form/elements/SelectField"

export interface SelectFormFieldProps<TEntity, TValue> extends FormElementProps<TEntity, TValue> {
    options: SelectOption<TValue>[]
    multiple?: boolean
}

export const SelectFormField = <E, V = E[keyof E]>({
                                                       name,
                                                       options,
                                                       readonly,
                                                       onChange,
                                                       value,
                                                       multiple = false,
                                                       ...props
                                                   }: SelectFormFieldProps<E, V>) => {
    const [field, , helpers] = useField<V | V[] | null>(name)
    const { isSubmitting } = useFormikContext()

    useEffect(() => {
        if (field.value === undefined) {
            helpers.setValue(multiple ? [] : null)
        }

        if (value !== undefined && value !== field.value) {
            helpers.setValue(value)
        }
    }, [value, multiple]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (newValue: V | V[] | null) => {
        if (!readonly) {
            helpers.setValue(newValue)
        }
        onChange?.(newValue as any)
    }
    return (
        <FormElement name={name} {...props}>
            <SelectField
                options={options}
                value={field.value}
                onChange={handleChange}
                readonly={readonly || isSubmitting}
                multiple={multiple}
                {...props} />
        </FormElement>
    )
}

export default SelectFormField
