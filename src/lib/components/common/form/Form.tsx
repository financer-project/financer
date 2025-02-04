import { PropsWithoutRef, ReactNode, useState } from "react"
import { Form as FormikForm, Formik, FormikProps } from "formik"
import { z } from "zod"
import { Button } from "@/src/lib/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/src/lib/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

    [prop: string]: any
}

export const FORM_ERROR = "FORM_ERROR"

export function Form<S extends z.ZodType<any, any>>({
                                                        children,
                                                        submitText,
                                                        schema,
                                                        initialValues,
                                                        onSubmit
                                                    }: Readonly<FormProps<S>>) {
    const [formError, setFormError] = useState<string | null>(null)
    return (
        <Formik<z.infer<typeof schema>>
            initialValues={initialValues ?? {}}
            validate={(values) => {
                try {
                    schema.parse(values)
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        return error.formErrors.fieldErrors
                    }
                }
            }}
            onSubmit={async (values, { setErrors }) => {
                const { FORM_ERROR, ...otherErrors } = (await onSubmit(values)) || {}

                if (FORM_ERROR) {
                    setFormError(FORM_ERROR)
                }

                if (Object.keys(otherErrors).length > 0) {
                    setErrors(otherErrors)
                }
            }}
        >
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
