"use client"

import React from "react"
import { useFormikContext } from "formik"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Checkbox } from "@/src/lib/components/ui/checkbox"
import { Label } from "@/src/lib/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"
import { useAccounts } from "@/src/lib/components/provider/AccountProvider"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { Heading3 } from "@/src/lib/components/common/typography"

interface ColumnMapping {
    csvHeader: string
    fieldName: string
}

interface ValueMapping {
    sourceValue: string
    targetType: string
    targetId: string
}

interface ConfirmationStepProps {
    csvData: string[][]
}

export const ConfirmationStep = ({ csvData }: ConfirmationStepProps) => {
    const { values, setFieldValue } = useFormikContext<{
        name: string
        file: File | null
        separator: string
        columnMappings: ColumnMapping[]
        valueMappings: ValueMapping[]
        confirmed: boolean
    }>()

    const accounts = useAccounts()
    const categories = useCategories()

    const getAccountName = (id: string) => {
        return accounts.find(acc => acc.id === id)?.name ?? "Unknown Account"
    }

    const getCategoryName = (id: string) => {
        return categories.findNode(cat => cat.id === id)?.data.name ?? "Unknown Category"
    }

    // Count how many transactions will be imported
    const transactionCount = csvData.length

    // Check if all required mappings are configured
    const hasRequiredMappings = 
        values.columnMappings.some(m => m.fieldName === "amount") &&
        values.columnMappings.some(m => m.fieldName === "valueDate")

    // Check if all account identifiers are mapped
    const accountIdentifierIndex = values.columnMappings.findIndex(m => m.fieldName === "accountIdentifier")
    const hasAllAccountMappings = accountIdentifierIndex >= 0 &&
        Array.from(new Set(csvData.map(row => row[accountIdentifierIndex])))
            .filter(Boolean)
            .every(identifier =>
                values.valueMappings.some(m =>
                    m.sourceValue === identifier &&
                    m.targetType === "account" &&
                    m.targetId
                )
            )

    const getSeparatorDescription = (separator: string) => {
        switch (separator) {
            case "," :
                return "Comma (,)"
            case ";" :
                return "Semicolon (;)"
            case "\t" :
                return "Tab (\\t)"
            case  "|" :
                return "Pipe (|)"
            default:
                return separator
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-4 flex flex-col gap-8">
                    <div>
                        <Heading3>Import Details</Heading3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="text-sm text-muted-foreground">Name:</div>
                            <div className="text-sm font-medium">{values.name}</div>

                            <div className="text-sm text-muted-foreground">File:</div>
                            <div className="text-sm font-medium">{values.file?.name}</div>

                            <div className="text-sm text-muted-foreground">Separator:</div>
                            <div className="text-sm font-medium">
                                {getSeparatorDescription(values.separator)}
                            </div>

                            <div className="text-sm text-muted-foreground">Transactions:</div>
                            <div className="text-sm font-medium">{transactionCount}</div>
                        </div>
                    </div>

                    <div>
                        <Heading3>Column Mappings</Heading3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {values.columnMappings
                                .filter(mapping => mapping.fieldName !== null)
                                .map((mapping) => (
                                    <React.Fragment key={`column-mapping-${mapping.csvHeader}`}>
                                        <div className="text-sm text-muted-foreground">{mapping.csvHeader}:</div>
                                        <div className="text-sm font-medium">{mapping.fieldName}</div>
                                    </React.Fragment>
                                ))}
                        </div>
                    </div>

                    {values.valueMappings.filter(m => m.targetType === "account" && m.targetId).length > 0 && (
                        <div>
                            <Heading3 className="font-medium">Account Mappings</Heading3>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {values.valueMappings
                                    .filter(mapping => mapping.targetType === "account" && mapping.targetId)
                                    .map((mapping) => (
                                        <React.Fragment key={`account-${mapping.targetId}`}>
                                            <div className="text-sm text-muted-foreground">{mapping.sourceValue}:</div>
                                            <div
                                                className="text-sm font-medium">{getAccountName(mapping.targetId)}</div>
                                        </React.Fragment>
                                    ))}
                            </div>
                        </div>
                    )}

                    {values.valueMappings.filter(m => m.targetType === "category" && m.targetId).length > 0 && (
                        <div>
                            <Heading3 className="font-medium">Category Mappings</Heading3>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {values.valueMappings
                                    .filter(mapping => mapping.targetType === "category" && mapping.targetId)
                                    .map((mapping) => (
                                        <React.Fragment key={`category-${mapping.targetId}`}>
                                            <div className="text-sm text-muted-foreground">{mapping.sourceValue}:</div>
                                            <div
                                                className="text-sm font-medium">{getCategoryName(mapping.targetId)}</div>
                                        </React.Fragment>
                                    ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {!hasRequiredMappings && (
                <Alert variant="destructive">
                    <AlertTitle>Missing required mappings</AlertTitle>
                    <AlertDescription>
                        You must map columns to the following required fields: Amount and Value Date.
                    </AlertDescription>
                </Alert>
            )}

            {!hasAllAccountMappings && accountIdentifierIndex >= 0 && (
                <Alert variant="default">
                    <AlertTitle>Missing account mappings</AlertTitle>
                    <AlertDescription>
                        Some account identifiers in your CSV are not mapped to accounts. This may cause issues during
                        import.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-start space-x-2">
                <Checkbox
                    id="confirmed"
                    checked={values.confirmed}
                    onCheckedChange={(checked) => setFieldValue("confirmed", checked)}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor="confirmed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        I confirm that I want to import {transactionCount} transactions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        This will create new transactions in your account. The import will run in the background and may
                        take some time to complete.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationStep
