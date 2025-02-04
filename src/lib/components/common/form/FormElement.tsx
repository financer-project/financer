import React, { PropsWithChildren } from "react"
import { ErrorMessage } from "formik"
import { Label } from "@/src/lib/components/ui/label"
import { cn } from "@/lib/utils"

export interface FormElementProps {
    label: string
    name: string
    required?: boolean
    placeholder?: string
    className?: string,
    readonly?: boolean,
    description?: string
}

const FormElement: React.FC<PropsWithChildren<FormElementProps>> = ({
                                                                        label,
                                                                        name,
                                                                        children,
                                                                        className,
                                                                        required,
                                                                        description
                                                                    }) => {
    return (
        <div className={cn("flex flex-col gap-2 flex-1", className)}>
            <Label htmlFor={name}>
                {label}
                {required && <span className={"text-destructive"}> *</span>}
            </Label>

            {children}

            {description && <small className={"text-muted-foreground"}>{description}</small>}

            <ErrorMessage name={name}>
                {(msg) => <small className={"text-destructive"}>{msg}</small>}
            </ErrorMessage>
        </div>
    )
}

export default FormElement
