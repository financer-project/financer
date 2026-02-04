import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { Textarea } from "@/src/lib/components/ui/textarea"
import { useFormFieldInit } from "@/src/lib/hooks/use-form-field-init"

export const TextAreaField = <E, >({ name, label, ...props }: FormElementProps<E, string>) => {
    const [input, , helpers] = useField(name as string)
    const { isSubmitting } = useFormikContext()

    useFormFieldInit({
        fieldValue: input.value,
        propValue: props.value,
        defaultValue: null,
        helpers
    })

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
