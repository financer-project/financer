"use client"

import { useEffect } from "react"
import { useFormikContext } from "formik"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"
import { Separator } from "@/src/lib/components/ui/separator"

interface ColumnMappingStepProps {
    csvHeaders: string[]
    csvData: string[][]
}

// Transaction field options for mapping 
const transactionFields = [
    { label: "Name", value: "name" },
    { label: "Amount", value: "amount" },
    { label: "Type", value: "type" },
    { label: "Value Date", value: "valueDate" },
    { label: "Description", value: "description" },
    { label: "Account Identifier", value: "accountIdentifier" },
    { label: "Account Name", value: "accountName" },
    { label: "Category Name", value: "categoryName" }
]

// Format options for date fields
const dateFormatOptions = [
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
    { label: "DD.MM.YYYY", value: "DD.MM.YYYY" },
    { label: "MM-DD-YYYY", value: "MM-DD-YYYY" },
    { label: "YYYY/MM/DD", value: "YYYY/MM/DD" }
]

// Format options for amount fields
const amountFormatOptions = [
    { label: "1,234.56 (comma as thousands separator)", value: "comma" },
    { label: "1.234,56 (dot as thousands separator)", value: "dot" }
]

interface ColumnMapping {
    csvHeader: string
    fieldName: string | null
    format: string | null
}

export const ColumnMappingStep = ({ csvHeaders, csvData }: ColumnMappingStepProps) => {
    const { values, setFieldValue } = useFormikContext<{ columnMappings: ColumnMapping[] }>()

    // Initialize column mappings if empty
    useEffect(() => {
        if (!values.columnMappings || values.columnMappings.length === 0) {
            // Try to auto-map columns based on header names
            const initialMappings = csvHeaders.map(header => {
                const lowerHeader = header.toLowerCase()
                let fieldName = null

                // Simple auto-mapping logic
                if (lowerHeader.includes("name") || lowerHeader.includes("description")) {
                    fieldName = "name"
                } else if (lowerHeader.includes("amount") || lowerHeader.includes("sum")) {
                    fieldName = "amount"
                } else if (lowerHeader.includes("date")) {
                    fieldName = "valueDate"
                } else if (lowerHeader.includes("type")) {
                    fieldName = "type"
                } else if (lowerHeader.includes("account") || lowerHeader.includes("iban")) {
                    fieldName = "accountIdentifier"
                } else if (lowerHeader.includes("category")) {
                    fieldName = "categoryName"
                } else if (lowerHeader.includes("note") || lowerHeader.includes("memo")) {
                    fieldName = "description"
                }

                return {
                    csvHeader: header,
                    fieldName,
                    format: null
                }
            })

            setFieldValue("columnMappings", initialMappings)
        }
    }, [csvHeaders, setFieldValue, values.columnMappings])

    const handleMappingChange = async (header: string, value: string | null) => {
        const newMappings = values.columnMappings.map(mapping =>
            mapping.csvHeader === header ? { ...mapping, fieldName: value, format: null } : mapping
        )
        await setFieldValue("columnMappings", newMappings)
    }

    const handleFormatChange = async (header: string, format: string | null) => {
        const newMappings = values.columnMappings.map(mapping =>
            mapping.csvHeader === header ? { ...mapping, format } : mapping
        )
        await setFieldValue("columnMappings", newMappings)
    }

    // Show a preview of the first row with the mappings
    const previewRow = csvData.length > 0 ? csvData[0] : []

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {csvHeaders.map((header, index) => {
                    const currentMapping = values.columnMappings.find(mapping => mapping.csvHeader === header)
                    return (
                        <div key={`colum-mapping-${header}-${index}`} className="flex flex-col gap-4">
                            <Separator />
                            <div className={"flex flex-col gap-2"}>
                                <div className="flex items-center justify-between">
                                    <div className={"flex flex-col gap-2"}>
                                        <p className={"font-medium"}>
                                            Column: <span className="font-medium">{header}</span>
                                        </p>
                                        {previewRow[index] && (
                                            <p className="text-xs text-muted-foreground">
                                                Example value: <span className="font-mono">{previewRow[index]}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-1/2 items-center">
                                        <SelectField
                                            options={transactionFields.filter(field =>
                                                field.value === currentMapping?.fieldName ||
                                                !values.columnMappings.find(mapping => mapping.fieldName === field.value))}
                                            value={currentMapping?.fieldName ?? null}
                                            onChange={(value) => handleMappingChange(header, value)}
                                            placeholder="Ignore this column"
                                        />
                                    </div>
                                </div>

                                {/* Show format options for date fields */}
                                {currentMapping?.fieldName === "valueDate" && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm">Date Format: </p>
                                        <div className="w-1/2">
                                            <SelectField
                                                options={dateFormatOptions}
                                                value={currentMapping.format}
                                                onChange={(value) => handleFormatChange(header, value)}
                                                placeholder="Select date format"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Show format options for amount fields */}
                                {currentMapping?.fieldName === "amount" && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm"> Amount Format: </p>
                                        <div className="w-1/2">
                                            <SelectField
                                                options={amountFormatOptions}
                                                value={currentMapping.format}
                                                onChange={(value) => handleFormatChange(header, value)}
                                                placeholder="Select amount format"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mapping Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    {values.columnMappings
                        .filter(mapping => mapping.fieldName !== null)
                        .map((mapping) => (
                            <div key={`column-mapping-${mapping.fieldName}`} className="flex justify-between text-sm">
                                <span className="font-medium">
                                    {transactionFields.find(field => field.value === mapping.fieldName)?.label}:
                                </span>
                                <span className="text-muted-foreground">
                                    {previewRow[csvHeaders.indexOf(mapping.csvHeader)] || "N/A"}
                                </span>
                            </div>
                        ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default ColumnMappingStep
