import { PropsWithoutRef, ReactNode, useState } from "react"
import { Form as FormikForm, Formik, FormikErrors, FormikProps } from "formik"
import { z } from "zod"
import { Button } from "@/src/lib/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { toFormikValidationSchema } from "zod-formik-adapter"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StepFormProps<S extends z.ZodSchema<any>>
    extends Omit<PropsWithoutRef<React.JSX.IntrinsicElements["form"]>, "onSubmit"> {
    schema: S
    children?: ReactNode
    submitText?: string
    backText?: string
    onSubmit: (values: z.infer<S>) => Promise<void | OnSubmitResult>
    onBack?: () => void
    initialValues?: FormikProps<z.infer<S>>["initialValues"]
    currentStep: number
    totalSteps: number
}

interface OnSubmitResult {
    FORM_ERROR?: string

    [prop: string]: any //eslint-disable-line @typescript-eslint/no-explicit-any
}

export const FORM_ERROR = "FORM_ERROR"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StepForm<S extends z.ZodType<any, any>>({
                                                        children,
                                                        submitText = "Next",
                                                        backText = "Back",
                                                        schema,
                                                        initialValues,
                                                        onSubmit,
                                                        onBack,
                                                        currentStep,
                                                        totalSteps
                                                    }: Readonly<StepFormProps<S>>) {
    const [formError, setFormError] = useState<string | null>(null)

    const searchParams = useSearchParams() // Access query parameters dynamically

    const getInitialValues = () => {
        if (searchParams) {
            const params = Object.fromEntries(searchParams.entries()) // Convert query params into an object
            return {
                ...initialValues,
                ...params
            }
        }
        return initialValues
    }

    return (
        <Formik<z.infer<typeof schema>>
            initialValues={getInitialValues()}
            validationSchema={toFormikValidationSchema(schema)}
            onSubmit={async (values, { setErrors }) => {
                const { FORM_ERROR, ...otherErrors } = (await onSubmit(values)) || {}

                if (FORM_ERROR) {
                    setFormError(FORM_ERROR)
                }

                if (Object.keys(otherErrors).length > 0) {
                    setErrors(otherErrors as FormikErrors<typeof values>)
                }
            }}>
            <FormikForm className="flex flex-col gap-4 w-full my-4">
                {formError && (
                    <Alert variant={"destructive"}>
                        <AlertCircle />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}

                <div className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground">
                        Step {currentStep} of {totalSteps}
                    </div>
                    <div className="w-full bg-muted h-2 mt-2 rounded-full">
                        <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {children}

                <div className={"flex justify-between mt-4"}>
                    {onBack && (
                        <Button variant={"outline"} type={"button"} onClick={onBack}>
                            {backText}
                        </Button>
                    )}
                    <div className={onBack ? "" : "ml-auto"}>
                        <Button variant={"default"} type={"submit"}>
                            {submitText}
                        </Button>
                    </div>
                </div>
            </FormikForm>
        </Formik>
    )
}

export default StepForm