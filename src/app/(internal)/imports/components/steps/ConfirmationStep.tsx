"use client"

import React from "react"
import { useFormikContext } from "formik"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Checkbox } from "@/src/lib/components/ui/checkbox"
import { Label } from "@/src/lib/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"

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
  values: {
    name: string
    file: File | null
    separator: string
    columnMappings: ColumnMapping[]
    valueMappings: ValueMapping[]
    confirmed: boolean
  }
  csvData: string[][]
}

// Mock data for accounts and categories - in a real app, these would come from the API
const mockAccounts = [
  { id: "acc1", name: "Checking Account" },
  { id: "acc2", name: "Savings Account" },
  { id: "acc3", name: "Credit Card" }
]

const mockCategories = [
  { id: "cat1", name: "Groceries" },
  { id: "cat2", name: "Rent" },
  { id: "cat3", name: "Utilities" },
  { id: "cat4", name: "Entertainment" }
]

export const ConfirmationStep = ({ values, csvData }: ConfirmationStepProps) => {
  const { setFieldValue } = useFormikContext()

  const getAccountName = (id: string) => {
    return mockAccounts.find(acc => acc.id === id)?.name || "Unknown Account"
  }

  const getCategoryName = (id: string) => {
    return mockCategories.find(cat => cat.id === id)?.name || "Unknown Category"
  }

  // Count how many transactions will be imported
  const transactionCount = csvData.length

  // Count how many mappings are configured
  const columnMappingsCount = values.columnMappings.filter(m => m.fieldName !== "ignore").length
  const accountMappingsCount = values.valueMappings.filter(m => m.targetType === "account" && m.targetId).length
  const categoryMappingsCount = values.valueMappings.filter(m => m.targetType === "category" && m.targetId).length

  // Check if all required mappings are configured
  const hasRequiredMappings = values.columnMappings.some(m => m.fieldName === "name") &&
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Confirm Import</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Review your import configuration and confirm to start the import process.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <h4 className="font-medium">Import Details</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Name:</div>
              <div className="text-sm font-medium">{values.name}</div>

              <div className="text-sm text-muted-foreground">File:</div>
              <div className="text-sm font-medium">{values.file?.name}</div>

              <div className="text-sm text-muted-foreground">Separator:</div>
              <div className="text-sm font-medium">
                {values.separator === "," ? "Comma (,)" : 
                 values.separator === ";" ? "Semicolon (;)" : 
                 values.separator === "\t" ? "Tab (\\t)" : 
                 values.separator === "|" ? "Pipe (|)" : 
                 values.separator}
              </div>

              <div className="text-sm text-muted-foreground">Transactions:</div>
              <div className="text-sm font-medium">{transactionCount}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium">Column Mappings</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {values.columnMappings
                .filter(mapping => mapping.fieldName !== "ignore")
                .map((mapping, index) => (
                  <React.Fragment key={index}>
                    <div className="text-sm text-muted-foreground">{mapping.csvHeader}:</div>
                    <div className="text-sm font-medium">{mapping.fieldName}</div>
                  </React.Fragment>
                ))}
            </div>
          </div>

          {values.valueMappings.filter(m => m.targetType === "account" && m.targetId).length > 0 && (
            <div>
              <h4 className="font-medium">Account Mappings</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {values.valueMappings
                  .filter(mapping => mapping.targetType === "account" && mapping.targetId)
                  .map((mapping, index) => (
                    <React.Fragment key={index}>
                      <div className="text-sm text-muted-foreground">{mapping.sourceValue}:</div>
                      <div className="text-sm font-medium">{getAccountName(mapping.targetId)}</div>
                    </React.Fragment>
                  ))}
              </div>
            </div>
          )}

          {values.valueMappings.filter(m => m.targetType === "category" && m.targetId).length > 0 && (
            <div>
              <h4 className="font-medium">Category Mappings</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {values.valueMappings
                  .filter(mapping => mapping.targetType === "category" && mapping.targetId)
                  .map((mapping, index) => (
                    <React.Fragment key={index}>
                      <div className="text-sm text-muted-foreground">{mapping.sourceValue}:</div>
                      <div className="text-sm font-medium">{getCategoryName(mapping.targetId)}</div>
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
            You must map columns to the following required fields: Name, Amount, and Value Date.
          </AlertDescription>
        </Alert>
      )}

      {!hasAllAccountMappings && accountIdentifierIndex >= 0 && (
        <Alert variant="warning">
          <AlertTitle>Missing account mappings</AlertTitle>
          <AlertDescription>
            Some account identifiers in your CSV are not mapped to accounts. This may cause issues during import.
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
            This will create new transactions in your account. The import will run in the background and may take some time to complete.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationStep
