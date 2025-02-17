import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { Textarea } from "@/src/lib/components/ui/textarea"
import { useEffect } from "react"

export const TextAreaField = <E, >({ name, label, ...props }: FormElementProps<E, string>) => {
    const [input, , helpers] = useField(name)
    const { isSubmitting } = useFormikContext()

    useEffect(() => {
        if (input.value === undefined) {
            helpers.setValue(null)
        }

        if (props.value && props.value !== input.value) {
            helpers.setValue(props.value)
        }
    }, [props, helpers, input])

    return (
        <FormElement {...{ name, label }}>
            <Textarea {...input}
                      disabled={isSubmitting || props.readonly}
                      placeholder={props.placeholder} />
        </FormElement>
    )
}

TextAreaField.displayName = "TextField"

export default TextAreaField
