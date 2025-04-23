"use client"

import { useRef, useState, useEffect, ChangeEvent } from "react"
import { useFormikContext } from "formik"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Label } from "@/src/lib/components/ui/label"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"
import { Card, CardContent } from "@/src/lib/components/ui/card"

interface FileUploadStepProps {
    setCsvHeaders: (headers: string[]) => void
    setCsvData: (data: string[][]) => void
}

export const FileUploadStep = ({ setCsvHeaders, setCsvData }: FileUploadStepProps) => {
    const { setFieldValue, values } = useFormikContext<{ name: string; file: File | null; separator: string }>()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState<string>("")
    const [previewData, setPreviewData] = useState<string[][]>([])

    // Define separator options
    const separatorOptions = [
        { label: "Comma (,)", value: "," },
        { label: "Semicolon (;)", value: ";" },
        { label: "Tab (\\t)", value: "\t" },
        { label: "Pipe (|)", value: "|" }
    ]

    // Initialize separator with default value if not set
    useEffect(() => {
        if (!values.separator) {
            setFieldValue("separator", ",")
        }
    }, [values.separator, setFieldValue])

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setFieldValue("file", file)

        // Read the file
        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            if (!content) return

            const separator = values.separator || ","

            // Parse CSV
            const lines = content.split("\n").filter(line => line.trim() !== "")
            const headers = lines[0].split(separator).map(header => header.trim())

            // Get a preview of the data (first 5 rows)
            const data = lines.slice(1, 6).map(line =>
                line.split(separator).map(cell => cell.trim())
            )

            setCsvHeaders(headers)
            setCsvData(lines.slice(1).map(line => line.split(separator).map(cell => cell.trim())))
            setPreviewData(data)
        }
        reader.readAsText(file)
    }

    // Handle separator change and reparse file if needed
    const handleSeparatorChange = (value: string) => {
        setFieldValue("separator", value)

        // If a file is already loaded, reparse it with the new separator
        if (values.file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result as string
                if (!content) return

                // Parse CSV with new separator
                const lines = content.split("\n").filter(line => line.trim() !== "")
                const headers = lines[0].split(value).map(header => header.trim())

                // Get a preview of the data (first 5 rows)
                const data = lines.slice(1, 6).map(line =>
                    line.split(value).map(cell => cell.trim())
                )

                setCsvHeaders(headers)
                setCsvData(lines.slice(1).map(line => line.split(value).map(cell => cell.trim())))
                setPreviewData(data)
            }
            reader.readAsText(values.file)
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-6">
            <TextField
                name="name"
                label="Import Name"
                placeholder="Enter a name for this import"
                required />

            <div className="space-y-2">
                <Label>CSV Separator</Label>
                <SelectField
                    options={separatorOptions}
                    value={values.separator || ","}
                    onChange={handleSeparatorChange}
                    placeholder="Select separator"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Select the character that separates columns in your CSV file
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <div className="flex items-center gap-2">
                    <Input
                        ref={fileInputRef}
                        id="file"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleButtonClick}
                    >
                        Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
            {fileName || "No file chosen"}
          </span>
                </div>
            </div>

            {previewData.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-2">Preview (first 5 rows)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                <tr className="bg-muted">
                                    {previewData[0].map((_, index) => (
                                        <th key={index} className="p-2 text-left border">
                                            Column {index + 1}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {previewData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="p-2 border">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default FileUploadStep
