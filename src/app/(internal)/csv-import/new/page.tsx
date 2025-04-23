"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useState } from "react"
import createCSVImport from "@/src/lib/model/csv-import/mutations/createCSVImport"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import { useCurrentUser } from "@/src/app/users/hooks/useCurrentUser"
import { Form } from "@/src/lib/components/common/form/Form"
import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import FileUploadField from "@/src/lib/components/common/form/elements/FileUploadField"
import { CSVImport } from "@prisma/client"
import Header from "@/src/lib/components/content/nav/Header"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"

// Define the schema for the form
const CSVImportSchema = z.object({
    householdId: z.string().uuid("Please select a household"),
    file: z.any().refine((file) => file instanceof File, "Please select a file")
        .refine((file) => file?.type === "text/csv", "Please select a CSV file")
})

function NewCSVImportPage() {
    const router = useRouter()
    const [createCSVImportMutation] = useMutation(createCSVImport)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const currentUser = useCurrentUser()
    const [{ households }] = useQuery(getHouseholds, {})
    const currentHousehold = useCurrentHousehold()

    const onSubmit = async (values: z.infer<typeof CSVImportSchema>) => {
        const file = values.file as File

        setIsSubmitting(true)
        try {
            const reader = new FileReader()

            return new Promise<void>((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const fileString = e.target?.result as string
                        const csvImport = await createCSVImportMutation({
                            householdId: values.householdId,
                            fileString,
                            originalFileName: file.name
                        })
                        router.push(`/csv-import/${csvImport.id}/mapping`)
                        resolve()
                    } catch (error) {
                        console.error("Error uploading CSV:", error)
                        setIsSubmitting(false)
                        reject({ FORM_ERROR: "Failed to upload CSV file" })
                    }
                }

                reader.onerror = () => {
                    setIsSubmitting(false)
                    reject({ FORM_ERROR: "Failed to read CSV file" })
                }

                reader.readAsText(file)
            })
        } catch (error) {
            console.error("Error uploading CSV:", error)
            setIsSubmitting(false)
            return { FORM_ERROR: "An unexpected error occurred" }
        }
    }

    if (!currentUser) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <Header title={"Import a CSV File"}
                    subtitle={"Upload a CSV file containing transactions. You'll be able to map the columns to transaction properties in the next step."}
                    breadcrumbs={[
                        { label: "CSV Imports", url: "/csv-import" },
                        { label: "New" }
                    ]} />

            <Form
                schema={CSVImportSchema}
                onSubmit={onSubmit}
                submitText={isSubmitting ? "Uploading..." : "Upload and Continue"}
                initialValues={{ householdId: "", file: null }}>
                <div className={"flex flex-row gap-4 w-full"}>
                    <SelectFormField<CSVImport>
                        name={"householdId"}
                        label={"Select a household"}
                        value={currentHousehold?.id ?? null}
                        options={households.map((household) => ({
                            value: household.id,
                            label: household.name
                        }))}
                    />

                    <FileUploadField
                        name={"file"}
                        label={"CSV File"}
                        accept=".csv"
                        required />
                </div>
            </Form>
        </div>
    )
}

export default NewCSVImportPage
