"use client"

import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { Form, FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { ResetPassword } from "../validations"
import resetPassword from "@/src/lib/model/auth/mutations/resetPassword"
import { useMutation } from "@blitzjs/rpc"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams?.get("token")?.toString()
    const [resetPasswordMutation, { isSuccess }] = useMutation(resetPassword)

    return (
        <div>
            <h1>Set a New Password</h1>

            {isSuccess ? (
                <div>
                    <h2>Password Reset Successfully</h2>
                    <p>
                        Go to the <Link href="/">homepage</Link>
                    </p>
                </div>
            ) : (
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
                          } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                              if (error.name === "ResetPasswordError") {
                                  return {
                                      [FORM_ERROR]: error.message
                                  }
                              } else {
                                  return {
                                      [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again."
                                  }
                              }
                          }
                      }}>
                    <TextField name="password" label="New Password" type="password" />
                    <TextField name="passwordConfirmation" label="Confirm New Password" type="password" />
                </Form>
            )}
        </div>
    )
}
