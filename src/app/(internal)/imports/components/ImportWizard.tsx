"use client"

import { useState } from "react"
import { Formik, Form } from "formik"
import * as z from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { Button } from "@/src/lib/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Steps } from "./Steps"
import { FileUploadStep } from "./steps/FileUploadStep"
import { ColumnMappingStep } from "./steps/ColumnMappingStep"
import { ValueMappingStep } from "./steps/ValueMappingStep"
import { ConfirmationStep } from "./steps/ConfirmationStep"

// Define the steps in the wizard
const steps = [
    { id: "upload", title: "Upload File" },
    { id: "columns", title: "Map Columns" },
    { id: "values", title: "Map Values" },
    { id: "confirm", title: "Confirm & Import" }
]

// Define the validation schema for each step
const uploadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    file: z.any().refine(file => file, "File is required"),
    separator: z.string().default(",")
})

const columnMappingSchema = z.object({
    columnMappings: z.array(
        z.object({
            csvHeader: z.string(),
            fieldName: z.string()
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
    confirmed: z.boolean().refine(val => val === true, "You must confirm to proceed")
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
    const [currentStep, setCurrentStep] = useState(0)
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [csvData, setCsvData] = useState<string[][]>([])

    const goToNextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }

    const goToPreviousStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const handleSubmit = async (values: any) => {
        if (currentStep < steps.length - 1) {
            goToNextStep()
            return
        }

        // Final submission
        try {
            // We'll implement this later
            console.log("Submitting import job:", values)
            // Redirect to the imports page or show success message
        } catch (error) {
            console.error("Error submitting import job:", error)
        }
    }

    // Get the current step's validation schema
    const getCurrentStepSchema = () => {
        switch (currentStep) {
            case 0:
                return uploadSchema
            case 1:
                return columnMappingSchema
            case 2:
                return valueMappingSchema
            case 3:
                return confirmationSchema
            default:
                return uploadSchema
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Import Transactions</CardTitle>
                <Steps steps={steps} currentStep={currentStep} />
            </CardHeader>
            <Formik
                initialValues={{
                    name: "",
                    file: null,
                    separator: ",",
                    columnMappings: [],
                    valueMappings: [],
                    confirmed: false
                }}
                validationSchema={toFormikValidationSchema(getCurrentStepSchema())}
                onSubmit={handleSubmit}
                validateOnMount={false}
                validateOnChange={false}
                validateOnBlur={true}
            >
                {({ isSubmitting, isValid, values, setFieldValue }) => (
                    <Form>
                        <CardContent>
                            {currentStep === 0 && (
                                <FileUploadStep
                                    setCsvHeaders={setCsvHeaders}
                                    setCsvData={setCsvData}
                                />
                            )}
                            {currentStep === 1 && (
                                <ColumnMappingStep
                                    csvHeaders={csvHeaders}
                                    csvData={csvData}
                                />
                            )}
                            {currentStep === 2 && (
                                <ValueMappingStep
                                    csvData={csvData}
                                    columnMappings={values.columnMappings}
                                />
                            )}
                            {currentStep === 3 && (
                                <ConfirmationStep
                                    values={values}
                                    csvData={csvData}
                                />
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goToPreviousStep}
                                disabled={currentStep === 0 || isSubmitting}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isValid}
                            >
                                {currentStep < steps.length - 1 ? "Next" : "Submit"}
                            </Button>
                        </CardFooter>
                    </Form>
                )}
            </Formik>
        </Card>
    )
}
