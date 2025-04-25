import { PropsWithoutRef, ReactNode, useState } from "react"
import { Form as FormikForm, Formik, FormikErrors, FormikProps } from "formik"
import { z } from "zod"
import { Button } from "@/src/lib/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { toFormikValidationSchema } from "zod-formik-adapter"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormProps<S extends z.ZodSchema<any>>
    extends Omit<PropsWithoutRef<React.JSX.IntrinsicElements["form"]>, "onSubmit"> {
    schema: S
    children?: ReactNode
    submitText?: string
    onSubmit: (values: z.infer<S>) => Promise<void | OnSubmitResult>
    initialValues?: FormikProps<z.infer<S>>["initialValues"]
}

interface OnSubmitResult {
    FORM_ERROR?: string

    [prop: string]: any //eslint-disable-line @typescript-eslint/no-explicit-any
}

export const FORM_ERROR = "FORM_ERROR"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Form<S extends z.ZodType<any, any>>({
                                                        children,
                                                        submitText,
                                                        schema,
                                                        initialValues,
                                                        onSubmit
                                                    }: Readonly<FormProps<S>>) {
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
    }


    return (
        <Formik<z.infer<typeof schema>>
            initialValues={getInitialValues()}
            // validationSchema={toFormikValidationSchema(schema)}
            validate={(values) => {
                try {
                    schema.parse(values)
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        return error
                    }
                }
            }}
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

                {children}

                {submitText && (
                    <div className={"flex justify-end"}>
                        <Button variant={"default"} type={"submit"}>
                            {submitText}
                        </Button>
                    </div>
                )}
            </FormikForm>
        </Formik>
    )
}

export default Form
