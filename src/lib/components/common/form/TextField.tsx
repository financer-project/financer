import { forwardRef, PropsWithoutRef } from "react"
import { useField, useFormikContext } from "formik"
import { Input } from "@/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface LabeledTextFieldProps extends FormElementProps {
  type?: "text" | "password" | "email" | "number"
}

export const TextField = forwardRef<HTMLInputElement, LabeledTextFieldProps>(
  ({ name, label, ...props }, ref) => {
    const [input] = useField(name)
    const { isSubmitting } = useFormikContext()

    return (
      <FormElement {...{ name, label }}>
        <Input {...input} disabled={isSubmitting} {...props} ref={ref} />
      </FormElement>
    )
  },
)

TextField.displayName = "TextField"

export default TextField
