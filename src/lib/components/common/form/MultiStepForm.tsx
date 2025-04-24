import { Children, isValidElement, PropsWithChildren, PropsWithoutRef, ReactNode, useState } from "react"
import { Form as FormikForm, Formik, FormikErrors, FormikProps } from "formik"
import { z } from "zod"
import { Button } from "@/src/lib/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { CardTitle } from "@/src/lib/components/ui/card"
import { Heading2, SubTitle } from "@/src/lib/components/common/typography"
import { cn } from "@/lib/utils"

// Step component for use within MultiStepForm
export interface StepProps extends PropsWithChildren {
    name: string,
    title?: string,
    description?: string
    validationSchema?: z.ZodSchema<any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const Step = ({ children, ...props }: StepProps) => {
    return (
        <div className={"flex flex-col gap-4 w-full"}>
            <Heading2>{props.title}</Heading2>
            <SubTitle>{props.description}</SubTitle>
            {children}
        </div>
    )
}

// Steps visualization component
interface StepInfo {
    title: string
}

interface StepsVisualizationProps {
    steps: StepInfo[]
    currentStep: number,
    onClick: (index: number) => void
}

export const StepsVisualization = ({ steps, currentStep, onClick }: StepsVisualizationProps) => {

    const getClassName = (index: number) => {
        const className = "flex items-center justify-center w-8 h-8 rounded-full border-2"
        if (index < currentStep) {
            return cn(className, "border-primary bg-primary text-primary-foreground")
        } else {
            return cn(className, (index === currentStep
                ? "border-primary bg-background text-primary"
                : "border-muted bg-muted text-muted-foreground"))
        }
    }

    return (
        <div className="flex w-full py-4 relative">
            <div className={"flex w-full"}>
                {steps.map((step, index) => (
                    <div key={`step-${step.title}`}
                         className={cn("flex flex-col items-center flex-1 relative", index < currentStep ? "cursor-pointer" : "cursor-default")}
                         onClick={() => index < currentStep && onClick(index)}>
                        <div
                            className={getClassName(index)}>
                            {index + 1 < steps.length &&
                                <div className={"absolute h-0.5 bg-muted w-full left-1/2 mx-4"} />}

                            {index < currentStep
                                ? (<Check />)
                                : (<p className={"text-sm font-medium z-10"}>{index + 1}</p>)}
                        </div>
                        <span
                            className={cn("mt-2 text-xs font-medium", index <= currentStep ? "text-primary" : "text-muted-foreground")}>
                                {step.title}
                            </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// MultiStepForm component
export interface MultiStepFormProps<S extends z.ZodSchema<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
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

export function MultiStepForm<S extends z.ZodType<any, any>>({
                                                                 title,
                                                                 children,
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
            const { name, validationSchema } = (step as React.ReactElement<StepProps>).props
            return { name: name, validationSchema }
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
            ? (stepChildren as (formikProps: any) => React.ReactNode)(formikProps)
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

    const stepNames = steps.map(step => ({ title: step.name }))

    return (
        <div className="flex flex-col gap-8 w-full">
            {title && (
                <div className={"flex flex-col gap-4 w-full"}>
                    <CardTitle>{title}</CardTitle>
                    <StepsVisualization steps={stepNames}
                                        currentStep={currentStep}
                                        onClick={index => setCurrentStep(index)} />
                </div>
            )}

            <Formik
                initialValues={initialValues}
                validationSchema={toFormikValidationSchema(getCurrentStepSchema())}
                onSubmit={handleSubmit}
                validateOnMount={   false}
                validateOnChange={true}
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

                        {renderCurrentStepContent(formikProps)}

                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goToPreviousStep}
                                disabled={currentStep === 0 || formikProps.isSubmitting}>
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={formikProps.isSubmitting || !formikProps.isValid}>
                                {currentStep < steps.length - 1 ? "Next" : "Submit"}
                            </Button>
                        </div>
                    </FormikForm>
                )}
            </Formik>
        </div>
    )
}

export default MultiStepForm
