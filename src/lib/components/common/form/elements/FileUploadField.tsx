import { FormikValues, useFormikContext } from "formik"
import { Input } from "@/src/lib/components/ui/input"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { ChangeEvent, useRef, useState } from "react"
import { Button } from "../../../ui/button"

export interface FileUploadFieldProps<E> extends FormElementProps<E, File> {
    accept?: string
}

export const FileUploadField = <E, >({ name, accept = "*", onChange, ...props }: FileUploadFieldProps<E>) => {
    const { setFieldValue, values } = useFormikContext<{ [name]: File }>()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState<string>("")
    const { isSubmitting } = useFormikContext<FormikValues>()


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null

        setFileName(file?.name ?? "")
        setFieldValue(name as string, file ?? null)

        onChange?.(file)
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <FormElement name={name} {...props}>
            <div className="flex items-center gap-2">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleFileChange}
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting || props.readonly}
                    onClick={handleButtonClick}>
                    Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                    {fileName ?? "No file chosen"}
                </span>
            </div>

            {/*<Input name={input.name}*/}
            {/*       disabled={isSubmitting || props.readonly}*/}
            {/*       onChange={onChangeFile}*/}
            {/*       accept={accept}*/}
            {/*       type={"file"}*/}
            {/*       className={"flex items-center p-2 w-auto"} />*/}
        </FormElement>
    )
}

export default FileUploadField
