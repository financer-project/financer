import { forwardRef, useEffect } from "react"
import { useField, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface LabeledTextFieldProps extends FormElementProps {
    type?: "text" | "password" | "email" | "number"
}

export const TextField = forwardRef<HTMLInputElement, LabeledTextFieldProps>(
    ({ name, ...props }, ref) => {
        const [input, , helpers] = useField(name)
        const { isSubmitting } = useFormikContext()

        useEffect(() => {
            if (props.value !== undefined && props.value !== input.value) {
                helpers.setValue(props.value)
            }
        }, [props, helpers])

        return (
            <FormElement name={name} {...props}>
                <Input {...input}
                       disabled={isSubmitting || props.readonly}
                       type={props.type}
                       ref={ref} />
            </FormElement>
        )
    }
)

TextField.displayName = "TextField"

export default TextField
