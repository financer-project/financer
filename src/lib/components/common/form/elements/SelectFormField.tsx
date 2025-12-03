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
    const [field, , helpers] = useField<V | V[] | null>(name as string)
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
        onChange?.(newValue as V)
    }
    return (
        <FormElement name={name} {...props}>
            {multiple
                ? <SelectField
                    options={options}
                    value={field.value as V[]}
                    onChange={handleChange as (newValue: V[] | null) => void}
                    readonly={readonly || isSubmitting}
                    multiple={true}
                    {...props} />
                : <SelectField
                    options={options}
                    value={field.value as V}
                    onChange={handleChange as (newValue: V | null) => void}
                    readonly={readonly || isSubmitting}
                    multiple={false}
                    {...props} />}
        </FormElement>
    )
}

export default SelectFormField
