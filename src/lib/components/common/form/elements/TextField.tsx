import { useEffect } from "react"
import { FormikValues, useField, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface LabeledTextFieldProps<E, V> extends FormElementProps<E, V> {
    type?: "text" | "password" | "email" | "number"
}

export const TextField = <E, V>({ name, ...props }: LabeledTextFieldProps<E, V>) => {
    const [input, , helpers] = useField(name)
    const { isSubmitting, initialValues } = useFormikContext<FormikValues>()

    useEffect(() => {
        if (props.value && props.value !== input.value) {
            helpers.setValue(props.value)
        }
    }, [props, helpers, initialValues])

    return (
        <FormElement name={name} {...props}>
            <Input {...input}
                   disabled={isSubmitting || props.readonly}
                   type={props.type} />
        </FormElement>
    )
}

export default TextField
