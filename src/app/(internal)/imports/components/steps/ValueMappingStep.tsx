"use client"

import { useEffect, useState } from "react"
import { useFormikContext } from "formik"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/lib/components/ui/tabs"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"
import { Label } from "@/src/lib/components/ui/label"
import { useAccounts } from "@/src/lib/components/provider/AccountProvider"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"

interface ColumnMapping {
    csvHeader: string
    fieldName: string
}

interface ValueMapping {
    sourceValue: string
    targetType: string
    targetId: string
}

interface ValueMappingStepProps {
    csvData: string[][]
}

export const ValueMappingStep = ({ csvData }: ValueMappingStepProps) => {
    const { values, setFieldValue } = useFormikContext<{
        valueMappings: ValueMapping[]
        columnMappings: ColumnMapping[]
    }>()
    const [activeTab, setActiveTab] = useState("accounts")

    const accounts = useAccounts()
    const categories = useCategories()

    // Extract unique values for account identifiers and category names
    const accountIdentifierIndex = values.columnMappings.findIndex(m => m.fieldName === "accountIdentifier")
    const categoryNameIndex = values.columnMappings.findIndex(m => m.fieldName === "categoryName")

    const uniqueAccountIdentifiers = accountIdentifierIndex >= 0
        ? Array.from(new Set(csvData.map(row => row[accountIdentifierIndex])))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        : []

    const uniqueCategoryNames = categoryNameIndex >= 0
        ? Array.from(new Set(csvData.map(row => row[categoryNameIndex])))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        : []

    // Initialize value mappings if empty
    useEffect(() => {
        if (!values.valueMappings || values.valueMappings.length === 0) {
            const initialMappings: ValueMapping[] = []

            // Add account mappings
            uniqueAccountIdentifiers.forEach(identifier => {
                // Try to find a matching account by name similarity
                const matchingAccount = accounts.find(acc =>
                    acc.name.toLowerCase().includes(identifier.toLowerCase()) ||
                    identifier.toLowerCase().includes(acc.name.toLowerCase())
                )

                initialMappings.push({
                    sourceValue: identifier,
                    targetType: "account",
                    targetId: matchingAccount?.id || ""
                })
            })

            // Add category mappings
            uniqueCategoryNames.forEach(categoryName => {
                // Try to find a matching category by name similarity
                const matchingCategory = categories.findNode(cat =>
                    cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
                    categoryName.toLowerCase().includes(cat.name.toLowerCase())
                )

                initialMappings.push({
                    sourceValue: categoryName,
                    targetType: "category",
                    targetId: matchingCategory?.id || ""
                })
            })

            setFieldValue("valueMappings", initialMappings)
        }
    }, [uniqueAccountIdentifiers, uniqueCategoryNames, setFieldValue, values.valueMappings])

    const handleMappingChange = (sourceValue: string, targetType: string, targetId: string) => {
        const newMappings = [...values.valueMappings]
        const index = newMappings.findIndex(m => m.sourceValue === sourceValue && m.targetType === targetType)

        if (index >= 0) {
            newMappings[index] = {
                ...newMappings[index],
                targetId
            }
        } else {
            newMappings.push({
                sourceValue,
                targetType,
                targetId
            })
        }

        setFieldValue("valueMappings", newMappings)
    }

    const getValueMapping = (sourceValue: string, targetType: string) => {
        return values.valueMappings?.find(m => m.sourceValue === sourceValue && m.targetType === targetType)?.targetId || ""
    }

    return (
        <div className="space-y-6 grow">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="accounts" disabled={uniqueAccountIdentifiers.length === 0}>
                        Accounts ({uniqueAccountIdentifiers.length})
                    </TabsTrigger>
                    <TabsTrigger value="categories" disabled={uniqueCategoryNames.length === 0}>
                        Categories ({uniqueCategoryNames.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="accounts" className="mt-4">
                    {uniqueAccountIdentifiers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No account identifiers found in your CSV. Make sure you've mapped a column to "Account
                            Identifier".
                        </p>
                    ) : (
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                {uniqueAccountIdentifiers.map((identifier, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <Label className="w-1/2">
                                            <span className="font-medium">{identifier}</span>
                                        </Label>
                                        <div className="w-1/2">
                                            <SelectField
                                                options={accounts.map(acc => ({ label: acc.name, value: acc.id }))}
                                                value={getValueMapping(identifier, "account")}
                                                onChange={(value) => handleMappingChange(identifier, "account", value as string)}
                                                placeholder="Select account"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="categories" className="mt-4">
                    {uniqueCategoryNames.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No category names found in your CSV. Make sure you've mapped a column to "Category Name".
                        </p>
                    ) : (
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                {uniqueCategoryNames.map((categoryName, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <Label className="w-1/2">
                                            <span className="font-medium">{categoryName}</span>
                                        </Label>
                                        <div className="w-1/2">
                                            <SelectField
                                                options={categories.flatten().map(cat => ({
                                                    label: cat.name,
                                                    value: cat.id
                                                }))}
                                                value={getValueMapping(categoryName, "category")}
                                                onChange={(value) => handleMappingChange(categoryName, "category", value as string)}
                                                placeholder="Select category"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ValueMappingStep
