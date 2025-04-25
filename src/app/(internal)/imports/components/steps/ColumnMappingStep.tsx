"use client"

import { useEffect } from "react"
import { useFormikContext } from "formik"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"
import { Label } from "@/src/lib/components/ui/label"

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

interface ColumnMapping {
    csvHeader: string
    fieldName: string | null
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
                    fieldName
                }
            })

            setFieldValue("columnMappings", initialMappings)
        }
    }, [csvHeaders, setFieldValue, values.columnMappings])

    const handleMappingChange = async (header: string, value: string | null) => {
        const newMappings = values.columnMappings.map(mapping =>
            mapping.csvHeader === header ? { ...mapping, fieldName: value } : mapping
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
                        <div key={`colum-mapping-${header}-${index}`} className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>
                                    Column: <span className="font-medium">{header}</span>
                                </Label>
                                <div className="w-1/2">
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
                            {previewRow[index] && (
                                <div className="text-xs text-muted-foreground">
                                    Example value: <span className="font-mono">{previewRow[index]}</span>
                                </div>
                            )}
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