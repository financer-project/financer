"use client"

import { useState } from "react"
import * as z from "zod"
import { FileUploadStep } from "./steps/FileUploadStep"
import { ColumnMappingStep } from "./steps/ColumnMappingStep"
import { ValueMappingStep } from "./steps/ValueMappingStep"
import { ConfirmationStep } from "./steps/ConfirmationStep"
import { MultiStepForm, Step } from "@/src/lib/components/common/form/MultiStepForm"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

// Define the validation schema for each step
const uploadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    file: z.any().refine(file => file, "File is required"),
    separator: z.string().length(1).default(",")
})

const columnMappingSchema = z.object({
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string().nullable()
        })
    )
})

const valueMappingSchema = z.object({
    valueMappings: z.array(
        z.object({
            sourceValue: z.string(),
            targetType: z.string(),
            targetId: z.string()
        })
    )
})

const confirmationSchema = z.object({
    confirmed: z.boolean().refine(val => val, "You must confirm to proceed")
})

// Combine all schemas
const importSchema = z.object({
    name: z.string().min(1, "Name is required"),
    file: z.any().refine(file => file, "File is required"),
    separator: z.string().default(","),
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string()
        })
    ),
    valueMappings: z.array(
        z.object({
            sourceValue: z.string(),
            targetType: z.string(),
            targetId: z.string()
        })
    ),
    confirmed: z.boolean()
})

export const ImportWizard = () => {
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [csvData, setCsvData] = useState<string[][]>([])

    const handleSubmit = async (values: any) => {
        // Final submission
        try {
            // We'll implement this later
            console.log("Submitting import job:", values)
            // Redirect to the imports page or show success message
            return {}
        } catch (error) {
            console.error("Error submitting import job:", error)
            return { FORM_ERROR: "Failed to submit import job" }
        }
    }

    return (
        <MultiStepForm
            title="Import Transactions"
            schema={importSchema}
            initialValues={{
                name: "",
                file: null,
                separator: ",",
                columnMappings: [],
                valueMappings: [],
                confirmed: false
            }}
            onSubmit={handleSubmit}>
            <Step name="Upload File"

                  validationSchema={uploadSchema}>
                <FileUploadStep
                    setCsvHeadersAction={setCsvHeaders}
                    setCsvDataAction={setCsvData}
                />
            </Step>

            <Step name="Map Columns"
                  title={"Map CSV Columns to Transaction Fields"}
                  description={"Select which transaction field each CSV column should be mapped to."}
                  validationSchema={columnMappingSchema}>
                <ColumnMappingStep
                    csvHeaders={csvHeaders}
                    csvData={csvData}
                />
            </Step>

            <Step name="Map Values"
                  title={"Map Values to Entities"}
                  description={"Map values from your CSV to accounts and categories in your system."}
                  validationSchema={valueMappingSchema}>
                <ValueMappingStep
                    csvData={csvData} />
            </Step>

            <Step name="Confirm & Import"
                  title={"Confirm Import"}
                  description={"Review your import configuration and confirm to start the import process."}
                  validationSchema={confirmationSchema}>
                <ConfirmationStep
                    csvData={csvData}
                />
            </Step>
        </MultiStepForm>
    )
}
