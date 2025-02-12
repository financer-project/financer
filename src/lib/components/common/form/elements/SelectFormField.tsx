"use client"

import React from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { SelectField, SelectOption } from "@/src/lib/components/common/form/elements/SelectField"

export interface SelectFormFieldProps<TEntity, TValue = TEntity[keyof TEntity]> extends FormElementProps<TEntity, TValue> {
    options: SelectOption<TValue>[]
}

export const SelectFormField = <E, >({ name, options, readonly, ...props }: SelectFormFieldProps<E>) => {
    const [field, , helpers] = useField(name)
    const { isSubmitting } = useFormikContext()
    const handleChange = (value: E[keyof E] | null) => {
        if (!readonly) {
            helpers.setValue(value)
            props.onChange?.(value)
        }
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