"use client"

import { useEffect } from "react"
import { useFormikContext } from "formik"
import { Card, CardContent } from "@/src/lib/components/ui/card"
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
    { label: "Account Identifier", value: "accountIdentifier" }, // For mapping to accounts
    { label: "Category Name", value: "categoryName" }, // For mapping to categories
    { label: "Ignore this column", value: "ignore" }
]

interface ColumnMapping {
    csvHeader: string
    fieldName: string
}

export const ColumnMappingStep = ({ csvHeaders, csvData }: ColumnMappingStepProps) => {
    const { values, setFieldValue } = useFormikContext<{ columnMappings: ColumnMapping[] }>()

    // Initialize column mappings if empty
    useEffect(() => {
        if (!values.columnMappings || values.columnMappings.length === 0) {
            // Try to auto-map columns based on header names
            const initialMappings = csvHeaders.map(header => {
                const lowerHeader = header.toLowerCase()
                let fieldName = "ignore"

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

    const handleMappingChange = (index: number, value: string) => {
        const newMappings = [...values.columnMappings]
        newMappings[index] = {
            ...newMappings[index],
            fieldName: value
        }
        setFieldValue("columnMappings", newMappings)
    }

    // Show a preview of the first row with the mappings
    const previewRow = csvData.length > 0 ? csvData[0] : []

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium mb-2">Map CSV Columns to Transaction Fields</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Select which transaction field each CSV column should be mapped to.
                </p>
            </div>

            <div className="space-y-4">
                {csvHeaders.map((header, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>
                                Column: <span className="font-medium">{header}</span>
                            </Label>
                            <div className="w-1/2">
                                <SelectField
                                    options={transactionFields}
                                    value={values.columnMappings[index]?.fieldName || "ignore"}
                                    onChange={(value) => handleMappingChange(index, value as string)}
                                    placeholder="Select field"
                                />
                            </div>
                        </div>
                        {previewRow[index] && (
                            <div className="text-xs text-muted-foreground">
                                Example value: <span className="font-mono">{previewRow[index]}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-2">Mapping Preview</h3>
                    <div className="space-y-2">
                        {values.columnMappings
                            .filter(mapping => mapping.fieldName !== "ignore")
                            .map((mapping, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="font-medium">{mapping.fieldName}:</span>
                                    <span className="text-muted-foreground">
                    {csvHeaders.indexOf(mapping.csvHeader) >= 0 && previewRow.length > 0
                        ? previewRow[csvHeaders.indexOf(mapping.csvHeader)]
                        : "N/A"}
                  </span>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ColumnMappingStep