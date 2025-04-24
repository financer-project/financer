import { Children, isValidElement, PropsWithoutRef, ReactNode, useState } from "react"
import { Form as FormikForm, Formik, FormikErrors, FormikProps } from "formik"
import { z } from "zod"
import { Button } from "@/src/lib/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/lib/components/ui/card"

// Step component for use within MultiStepForm
export interface StepProps {
    title: string
    validationSchema?: z.ZodSchema<any>
    children: ReactNode | ((formikProps: any) => ReactNode)
}

export const Step = ({ children }: StepProps) => {
    return <>{typeof children === "function" ? children({}) : children}</>
}

// Steps visualization component
interface StepInfo {
    title: string
}

interface StepsVisualizationProps {
    steps: StepInfo[]
    currentStep: number
}

export const StepsVisualization = ({ steps, currentStep }: StepsVisualizationProps) => {
    return (
        <div className="flex w-full py-4 relative">
            <div className={"absolute h-0.5 bg-muted w-10/12 top-1/3 left-1/12"} />
            <div className={"flex justify-between w-full"}>
                {steps.map((step, index) => (
                    <div key={index} className="flex relative">
                        {/* Step circle */}
                        <div className="flex flex-col items-center relative z-10">
                            <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                ${index < currentStep
                                ? "border-primary bg-primary text-primary-foreground"
                                : index === currentStep
                                    ? "border-primary bg-background text-primary"
                                    : "border-muted bg-muted text-muted-foreground"
                            }`}>
                                {index < currentStep ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span
                                className={`
                  mt-2 text-xs font-medium
                  ${index <= currentStep ? "text-primary" : "text-muted-foreground"}
                `}>
                {step.title}
              </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// MultiStepForm component
export interface MultiStepFormProps<S extends z.ZodSchema<any>>
    extends Omit<PropsWithoutRef<React.JSX.IntrinsicElements["form"]>, "onSubmit"> {
    title?: string
    schema: S
    children: ReactNode
    initialValues: FormikProps<z.infer<S>>["initialValues"]
    onSubmit: (values: z.infer<S>) => Promise<void | OnSubmitResult>
    onStepComplete?: (stepIndex: number, values: any) => void
    onStepChange?: (newStepIndex: number) => void
}

interface OnSubmitResult {
    FORM_ERROR?: string

    [prop: string]: any
}

export const FORM_ERROR = "FORM_ERROR"

export function MultiStepForm<S extends z.ZodType<any, any>>({
                                                                 title,
                                                                 children,
                                                                 schema,
                                                                 initialValues,
                                                                 onSubmit,
                                                                 onStepComplete,
                                                                 onStepChange
                                                             }: Readonly<MultiStepFormProps<S>>) {
    const [currentStep, setCurrentStep] = useState(0)
    const [formError, setFormError] = useState<string | null>(null)

    // Extract Step components from children
    const steps = Children.toArray(children)
        .filter(child => isValidElement(child) && child.type === Step)
        .map(step => {
            const { title, validationSchema } = (step as React.ReactElement<StepProps>).props
            return { title, validationSchema }
        })

    const goToNextStep = (values: any) => {
        if (onStepComplete) {
            onStepComplete(currentStep, values)
        }

        if (currentStep < steps.length - 1) {
            const newStep = currentStep + 1
            setCurrentStep(newStep)
            if (onStepChange) {
                onStepChange(newStep)
            }
        }
    }

    const goToPreviousStep = () => {
        if (currentStep > 0) {
            const newStep = currentStep - 1
            setCurrentStep(newStep)
            if (onStepChange) {
                onStepChange(newStep)
            }
        }
    }

    // Get current step's validation schema
    const getCurrentStepSchema = () => {
        const stepSchema = steps[currentStep]?.validationSchema
        return stepSchema || z.object({})
    }

    // Render only the current step's children
    const renderCurrentStepContent = (formikProps: any) => {
        const stepArray = Children.toArray(children)
            .filter(child => isValidElement(child) && child.type === Step)

        if (stepArray.length === 0) {
            return null
        }

        const currentStepElement = stepArray[currentStep] as React.ReactElement<StepProps>
        const stepChildren = currentStepElement.props.children

        return typeof stepChildren === "function"
            ? stepChildren(formikProps)
            : stepChildren
    }

    const handleSubmit = async (values: any, { setErrors }: { setErrors: (errors: FormikErrors<any>) => void }) => {
        if (currentStep < steps.length - 1) {
            goToNextStep(values)
            return
        }

        // Final submission
        try {
            const { FORM_ERROR, ...otherErrors } = (await onSubmit(values)) || {}

            if (FORM_ERROR) {
                setFormError(FORM_ERROR)
            }

            if (Object.keys(otherErrors).length > 0) {
                setErrors(otherErrors as FormikErrors<typeof values>)
            }
        } catch (error) {
            console.error("Error submitting form:", error)
            setFormError("An unexpected error occurred")
        }
    }

    const stepTitles = steps.map(step => ({ title: step.title }))

    return (
        <Card className="w-full">
            {title && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <StepsVisualization steps={stepTitles} currentStep={currentStep} />
                </CardHeader>
            )}

            <Formik
                initialValues={initialValues}
                validationSchema={toFormikValidationSchema(getCurrentStepSchema())}
                onSubmit={handleSubmit}
                validateOnMount={false}
                validateOnChange={false}
                validateOnBlur={true}
            >
                {(formikProps) => (
                    <FormikForm className="flex flex-col gap-4 w-full">
                        {formError && (
                            <Alert variant={"destructive"}>
                                <AlertCircle />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        <CardContent>
                            {renderCurrentStepContent(formikProps)}
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goToPreviousStep}
                                disabled={currentStep === 0 || formikProps.isSubmitting}                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={formikProps.isSubmitting || !formikProps.isValid}                            >
                                {currentStep < steps.length - 1 ? "Next" : "Submit"}
                            </Button>
                        </CardFooter>
                    </FormikForm>
                )}
            </Formik>
        </Card>
    )
}

export default MultiStepForm
