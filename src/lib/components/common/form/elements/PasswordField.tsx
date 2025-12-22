"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/src/lib/components/ui/input-group"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { FormikValues, useField, useFormikContext } from "formik"

export const PasswordField = <E, V = string>({ name, ...props }: FormElementProps<E, V>) => {
    const [showPassword, setShowPassword] = useState(false)
    const [input, , helpers] = useField(name as string)
    const { isSubmitting } = useFormikContext<FormikValues>()

    return (
        <FormElement name={name} {...props}>
            <InputGroup>
                <InputGroupInput
                    {...input}
                    id={name.toString()}
                    type={showPassword ? "text" : "password"}
                    disabled={isSubmitting || props.readonly}
                    placeholder={props.placeholder}
                    onChange={event => {
                        if (event.target.value === "") {
                            helpers.setValue(null)
                            props.onChange?.(null)
                        } else {
                            input.onChange(event)
                            if (event.target.value) {
                                props.onChange?.(event.target.value as V)
                            }
                        }
                    }}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </FormElement>
    )
}

export default PasswordField
