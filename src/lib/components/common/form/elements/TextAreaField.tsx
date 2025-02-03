import { forwardRef } from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { Textarea } from "@/src/lib/components/ui/textarea"

export interface LabeledTextFieldProps extends FormElementProps {
}

export const TextField = forwardRef<HTMLInputElement, LabeledTextFieldProps>(
    ({ name, label, ...props }, ref) => {
        const [input] = useField(name)
        const { isSubmitting } = useFormikContext()

        return (
            <FormElement {...{ name, label }}>
                <Textarea {...input} disabled={isSubmitting || props.readonly} {...props} />
            </FormElement>
        )
    }
)

TextField.displayName = "TextField"

export default TextField
