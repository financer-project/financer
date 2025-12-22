"use client"

import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { PasswordField } from "@/src/lib/components/common/form/elements/PasswordField"
import { Form } from "@/src/lib/components/common/form/Form"
import { ResetPassword } from "../validations"
import resetPassword from "@/src/lib/model/auth/mutations/resetPassword"
import { useMutation } from "@blitzjs/rpc"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Input } from "@/src/lib/components/ui/input"
import { toast } from "sonner"

export function ResetPasswordForm() {
    const router = useRouter()
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
                      onSubmit={(values) => {
                          const promise = resetPasswordMutation({ ...values, token })
                          toast.promise(promise, {
                              loading: "Resetting password...",
                              success: () => {
                                  router.push("/login")
                                  return {
                                      message: "Password Reset",
                                      description: "Your password has been reset. You can now log in."
                                  }
                              },
                              error: (error) => ({
                                  message: "Could not reset password.",
                                  description: error.toString()
                              })
                          })
                      }}>
                    <PasswordField name="password"
                                   label="New Password"
                                   required />
                    <PasswordField name="passwordConfirmation"
                                   label="Confirm New Password"
                                   required />
                    <Input type="hidden" name="token" value={token} />
                </Form>
            </CardContent>
        </Card>
    )
}
