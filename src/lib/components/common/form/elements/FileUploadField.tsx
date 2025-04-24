import { FormikValues, useField, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface FileUploadFieldProps<E> extends FormElementProps<E, File> {
    accept?: string
}

export const FileUploadField = <E, >({ name, accept = "*", onChange, ...props }: FileUploadFieldProps<E>) => {
    const [input, , helpers] = useField(name)
    const { isSubmitting } = useFormikContext<FormikValues>()

    return (
        <FormElement name={name} {...props}>
            <Input name={input.name}
                   disabled={isSubmitting || props.readonly}
                   onChange={event => {
                       helpers.setValue(JSON.stringify(event.target.files?.[0] ?? null))
                       onChange?.(event.target.files?.[0] ?? null)
                   }}
                   accept={accept}
                   type={"file"}
                   className={"flex items-center p-2 w-auto"} />
        </FormElement>
    )
}

export default FileUploadField
