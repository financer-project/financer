import React, { PropsWithChildren } from "react"
import { ErrorMessage, useField } from "formik"
import { Label } from "@/components/ui/label"

export interface FormElementProps {
  label: string
  name: string
  placeholder?: string
}

const FormElement: React.FC<PropsWithChildren<FormElementProps>> = ({ label, name, children }) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>

      {children}

      <ErrorMessage name={name}>
        {(msg) => <small className={"text-destructive"}>{msg}</small>}
      </ErrorMessage>
    </div>
  )
}

export default FormElement
