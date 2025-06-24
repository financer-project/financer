import React, { PropsWithChildren } from "react"
import { ErrorMessage } from "formik"
import { Label } from "@/src/lib/components/ui/label"
import { cn } from "@/src/lib/util/utils"

export interface ElementProps<TValue> {
    value?: TValue | null
    onChange?: (value: TValue | null) => void
    required?: boolean
    placeholder?: string
    className?: string,
    readonly?: boolean,
}


export interface FormElementProps<TEntity, TValue = TEntity[keyof TEntity]> extends ElementProps<TValue> {
    name: keyof TEntity
    label: string
    description?: string,
}

const FormElement = <E, V>(
    { label, name, children, className, required, description }: PropsWithChildren<FormElementProps<E, V>>) => {
    return (
        <div className={cn("flex flex-col gap-2 flex-1", className)}>
            <Label htmlFor={name.toString()}>
                {label}
                {required && <span className={"text-destructive"}> *</span>}
            </Label>

            {children}

            {description && <small className={"text-muted-foreground"}>{description}</small>}

            <ErrorMessage name={name.toString()}>
                {(msg) => <small className={"text-destructive"}>{msg}</small>}
            </ErrorMessage>
        </div>
    )
}

export default FormElement
