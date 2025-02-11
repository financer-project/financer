import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { Textarea } from "@/src/lib/components/ui/textarea"

export interface TextAreaProps<E> extends FormElementProps<E, string> {
}

export const TextAreaField = <E, >({ name, label, ...props }: TextAreaProps<E>) => {
    const [input] = useField(name)
    const { isSubmitting } = useFormikContext()

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
