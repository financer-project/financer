import { forwardRef } from "react"
import { useField, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface LabeledTextFieldProps extends FormElementProps {
    type?: "text" | "password" | "email" | "number"
}

export const TextField = forwardRef<HTMLInputElement, LabeledTextFieldProps>(
    ({ name, ...props }, ref) => {
        const [input] = useField(name)
        const { isSubmitting } = useFormikContext()

        return (
            <FormElement name={name} {...props}>
                <Input {...input} disabled={isSubmitting} {...props} ref={ref} />
            </FormElement>
        )
    }
)

TextField.displayName = "TextField"

export default TextField
