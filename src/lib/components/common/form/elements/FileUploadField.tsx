"use client"

import React, { useState } from "react"
import { useField, useFormikContext } from "formik"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface FileUploadFieldProps<TEntity> extends FormElementProps<TEntity, File | null> {
    accept?: string
    multiple?: boolean
}

export const FileUploadField = <E,>({
    name,
    accept = "*",
    multiple = false,
    readonly,
    onChange,
    ...props
}: FileUploadFieldProps<E>) => {
    const [field, , helpers] = useField<File | null>(name)
    const { isSubmitting } = useFormikContext()
    const [fileName, setFileName] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        if (!readonly && file) {
            helpers.setValue(file)
            setFileName(file.name)
        }
        onChange?.(file)
    }

    return (
        <FormElement name={name} {...props}>
            <div className="flex flex-col gap-2">
                <input
                    type="file"
                    id={name.toString()}
                    name={name.toString()}
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    disabled={readonly || isSubmitting}
                    className="mt-1 block w-full text-sm
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold"
                />
                {fileName && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        Selected file: {fileName}
                    </p>
                )}
            </div>
        </FormElement>
    )
}

export default FileUploadField