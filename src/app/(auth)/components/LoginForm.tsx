"use client"

import { AuthenticationError } from "blitz"
import Link from "next/link"
import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { PasswordField } from "@/src/lib/components/common/form/elements/PasswordField"
import { Form, FORM_ERROR } from "@/src/lib/components/common/form/Form"
import login from "@/src/lib/model/auth/mutations/login"
import { Login } from "../validations"
import { useMutation } from "@blitzjs/rpc"
import { useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { cn } from "@/src/lib/util/utils"

export const LoginForm = () => {
    const [loginMutation] = useMutation(login)
    const router = useRouter()
    const next = useSearchParams()?.get("next")
    return (
        <Card className={"w-full"}>
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Login in to access Financer</CardDescription>
            </CardHeader>

            <CardContent className={cn("flex flex-col gap-4")}>
                <Form
                    submitText="Login"
                    schema={Login}
                    initialValues={{ email: "", password: "" }}
                    onSubmit={async (values) => {
                        try {
                            await loginMutation(values)
                            router.refresh()
                            if (next) {
                                router.push(next as Route)
                            } else {
                                router.push("/")
                            }
                        } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                            if (error instanceof AuthenticationError) {
                                return { [FORM_ERROR]: "Sorry, those credentials are invalid" }
                            } else {
                                return {
                                    [FORM_ERROR]:
                                    "Sorry, we had an unexpected error. Please try again. - " + error.toString()
                                }
                            }
                        }
                    }}>
                    <TextField name="email" label={"E-Mail Address"} placeholder="Email" />
                    <PasswordField name="password" label={"Password"} placeholder="Password" />

                    <small>
                        <span className={"text-muted-foreground"}>Forgot your password? </span>
                        <Link href={"/forgot-password"}>Reset Password</Link>
                    </small>
                </Form>

                <small>
                    <span className={"text-muted-foreground"}>You don&apos;t have an account? </span>
                    <Link href="/signup">Sign Up</Link>
                </small>
            </CardContent>
        </Card>
    )
}
