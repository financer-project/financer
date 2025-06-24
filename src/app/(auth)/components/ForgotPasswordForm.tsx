"use client"
import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { Form, FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { ForgotPassword } from "../validations"
import forgotPassword from "@/src/lib/model/auth/mutations/forgotPassword"
import { useMutation } from "@blitzjs/rpc"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { toast } from "@/src/lib/hooks/use-toast"

export function ForgotPasswordForm() {
    const [forgotPasswordMutation] = useMutation(forgotPassword)

    return (
        <Card className={"w-full"}>
            <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>
                    Enter the email address of your account to receive instructions to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    submitText="Submit"
                    schema={ForgotPassword}
                    initialValues={{ email: "" }}
                    onSubmit={async (values) => {
                        try {
                            await forgotPasswordMutation(values)
                            toast({
                                title: "Request Submitted",
                                description: "If your email is in our system, you will receive instructions to reset your password shortly.",
                                variant: "success"
                            })
                        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                            if (error) {
                                return { [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again." }
                            }
                        }
                    }}>
                    <TextField name="email"
                               label="E-Mail"
                               placeholder="E-Mail"
                               required />
                </Form>
            </CardContent>
        </Card>
    )
}
