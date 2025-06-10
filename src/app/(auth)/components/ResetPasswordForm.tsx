"use client"

import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { Form, FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { ResetPassword } from "../validations"
import resetPassword from "@/src/lib/model/auth/mutations/resetPassword"
import { useMutation } from "@blitzjs/rpc"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/src/lib/components/ui/input"

export function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams?.get("token")?.toString()
    const [resetPasswordMutation] = useMutation(resetPassword)

    return (
        <Card className={"w-full"}>
            <CardHeader>
                <CardTitle>Set a new password</CardTitle>
            </CardHeader>

            <CardContent>
                <Form submitText="Reset Password"
                      schema={ResetPassword}
                      initialValues={{
                          password: "",
                          passwordConfirmation: "",
                          token
                      }}
                      onSubmit={async (values) => {
                          try {
                              await resetPasswordMutation({ ...values, token })
                              toast({
                                  title: "Password Reset",
                                  description: "Your password has been reset. You can now log in.",
                                  variant: "success"
                              })
                          } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                              if (error) {
                                  return { [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again." }
                              }
                          }
                      }}>
                    <TextField name="password"
                               label="New Password"
                               type="password"
                               required />
                    <TextField name="passwordConfirmation"
                               label="Confirm New Password"
                               type="password"
                               required />
                    <Input type="hidden" name="token" value={token} />
                </Form>
            </CardContent>
        </Card>
    )
}
