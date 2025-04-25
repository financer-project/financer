"use client"

import { useEffect, useState } from "react"
import { useFormikContext } from "formik"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import { ScrollArea, ScrollBar } from "@/src/lib/components/ui/scroll-area"
import FileUploadField from "@/src/lib/components/common/form/elements/FileUploadField"

interface FileUploadStepProps {
    setCsvHeadersAction: (headers: string[]) => void
    setCsvDataAction: (data: string[][]) => void
}

export const FileUploadStep = ({ setCsvHeadersAction, setCsvDataAction }: FileUploadStepProps) => {
    const { setFieldValue, values } = useFormikContext<{ name: string; file: File | null; separator: string }>()
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

    const parseCSVContent = (content: string, separator: string) => {
        const lines = content.split("\n").filter(line => line.trim() !== "")
        const headers = lines[0].split(separator).map(header => header.trim())
        const data = lines.slice(0, 5).map(line =>
            line.split(separator).map(cell => cell.trim())
        )

        setCsvHeadersAction(headers)
        setCsvDataAction(lines.slice(1).map(line => line.split(separator).map(cell => cell.trim())))
        setPreviewData(data)
    }

    const handleFileChange = (file: File | null) => {
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            if (!content) return

            // Try to determine separator by checking first line
            const firstLine = content.split("\n")[0]
            let detectedSeparator = ","
            const separators = [",", ";", "\t", "|"]
            const counts = separators.map(sep => firstLine.split(sep).length - 1)
            const maxCount = Math.max(...counts)
            if (maxCount > 0) {
                detectedSeparator = separators[counts.indexOf(maxCount)]
                setFieldValue("separator", detectedSeparator)
            }

            setFieldValue("name", file.name.replace(/\.[^/.]+$/, ""))

            parseCSVContent(content, detectedSeparator)
        }
        reader.readAsText(file)
    }

    const handleSeparatorChange = (value: string | null) => {
        if (!value) return
        setFieldValue("separator", value)

        if (values.file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result as string
                if (!content) return
                parseCSVContent(content, value)
            }
            reader.readAsText(values.file)
        }
    }

    return (
        <div className="space-y-6">
            <FileUploadField
                name={"file"}
                label={"CSV File"}
                accept={".csv"}
                onChange={handleFileChange}
                required />

            <div className={"flex flex-row gap-4"}>
                <TextField
                    name="name"
                    label="Import Name"
                    placeholder="Enter a name for this import"
                    required />

                <SelectFormField
                    name={"separator"}
                    label={"CSV Separator"}
                    options={separatorOptions}
                    value={values.separator || ","}
                    onChange={handleSeparatorChange}
                    placeholder="Select separator"
                    description={"Select the character that separates columns in your CSV file"}
                    required />
            </div>

            {previewData.length > 0 && (
                <Card>
                    <CardContent className="flex flex-col p-4">
                        <h3 className="text-sm font-medium mb-2">Preview (first 5 rows)</h3>
                        <div className={"flex"}>
                            <ScrollArea type={"always"} className={"flex-1 w-1 overflow-x-auto"}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {previewData[0].map((columnName, index) => (
                                                <TableHead key={index}>
                                                    {columnName ?? `Column ${index + 1}`}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.slice(1).map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {row.map((cell, cellIndex) => (
                                                    <TableCell key={cellIndex}>
                                                        {cell}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation={"horizontal"} className={"w-full"} />
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default FileUploadStep
