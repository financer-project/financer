"use client"

import { useState } from "react"
import * as z from "zod"
import { useMutation } from "@blitzjs/rpc"
import { FileUploadStep } from "./steps/FileUploadStep"
import { ColumnMappingStep } from "./steps/ColumnMappingStep"
import { ValueMappingStep } from "./steps/ValueMappingStep"
import { ConfirmationStep } from "./steps/ConfirmationStep"
import { MultiStepForm, Step } from "@/src/lib/components/common/form/MultiStepForm"
import createImportJob from "@/src/lib/model/imports/mutations/createImportJob"
import updateImportJob from "@/src/lib/model/imports/mutations/updateImportJob"
import startImport from "@/src/lib/model/imports/mutations/startImport"
import { useRouter } from "next/navigation"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"

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
            fieldName: z.string().nullable(),
            format: z.string().nullable()
        })
    )
})

const valueMappingSchema = z.object({
    valueMappings: z.array(
        z.object({
            sourceValue: z.string(),
            targetType: z.string(),
            targetId: z.string().uuid().nullable()
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
            fieldName: z.string(),
            format: z.string().nullable()
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
    const router = useRouter()
    const currentHousehold = useCurrentHousehold()!
    const [createImportJobMutation] = useMutation(createImportJob)
    const [updateImportJobMutation] = useMutation(updateImportJob)
    const [startImportMutation] = useMutation(startImport)

    const handleSubmit = async (values: z.infer<typeof importSchema>) => {
        // Final submission
        try {
            // Create the import job (without file content)
            const importJob = await createImportJobMutation({
                name: values.name,
                fileName: values.file?.name,
                separator: values.separator,
                householdId: currentHousehold.id,
                columnMappings: values.columnMappings.filter(mapping => mapping.fieldName !== null),
                valueMappings: values.valueMappings.filter(mapping => mapping.targetId !== null)
            })

            // Upload the file to the backend
            if (values.file) {
                // Create a FormData object to send the file
                const formData = new FormData()
                formData.append("file", values.file)

                // Send the file to the backend
                const response = await fetch(`/api/imports/upload?importId=${importJob.id}`, {
                    method: "POST",
                    body: formData
                })

                if (!response.ok) {
                    throw new Error("Failed to upload file")
                }

                const data = await response.json()

                // Update the import job with the file path
                await updateImportJobMutation({
                    id: importJob.id,
                    filePath: data.filePath
                })
            }

            // Start the import process
            await startImportMutation({ id: importJob.id })

            // Redirect to the imports page
            router.push("/imports")
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
