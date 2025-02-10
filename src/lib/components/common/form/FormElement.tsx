import React, { PropsWithChildren } from "react"
import { ErrorMessage } from "formik"
import { Label } from "@/src/lib/components/ui/label"
import { cn } from "@/lib/utils"

export interface FormElementProps<Entity, Value> {
    label: string
    name: keyof Entity
    value?: Value
    required?: boolean
    placeholder?: string
    className?: string,
    readonly?: boolean,
    description?: string,
    onChange?: (value: string | number | null) => void
}

const FormElement = <E, V>(
    { label, name, children, className, required, description }: PropsWithChildren<FormElementProps<E, V>>) => {
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
