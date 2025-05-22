"use client"

import { Form, FORM_ERROR } from "@/src/lib/components/common/form/Form"
import signup from "@/src/lib/model/auth/mutations/signup"
import { Signup } from "../validations"
import { useMutation } from "@blitzjs/rpc"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { cn } from "@/lib/utils"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { useEffect, useState } from "react"

export const SignupForm = () => {
    const [signupMutation] = useMutation(signup)
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams?.get("token")?.toString()
    const [email] = useState("")

    // If there's a token, try to get the email from the token
    useEffect(() => {
        if (token) {
            // We could add an API endpoint to validate the token and get the email
            // For now, we'll just let the user enter their email
            // This ensures the email matches the one the invitation was sent to
        }
    }, [token])

    return (
        <Card className={"w-full"}>
            <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                    {token 
                        ? "Complete your registration using the invitation link."
                        : "You can register here."}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Form
                    submitText="Create Account"
                    schema={Signup}
                    initialValues={{ email, password: "", firstName: "", lastName: "" }}
                    onSubmit={async (values) => {
                        try {
                            await signupMutation({
                                ...values,
                                token: token || undefined
                            })
                            router.refresh()
                            router.push("/")
                        } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                            if (error.code === "P2002" && error.meta?.target?.includes("email")) {
                                // This error comes from Prisma
                                return { email: "This email is already being used" }
                            } else {
                                return { [FORM_ERROR]: error.toString() }
                            }
                        }
                    }}>
                    <div className={"flex flex-row gap-4"}>
                        <div className={cn("flex-flex-col gap-2")}>
                            <TextField
                                type={"text"}
                                label={"First Name"}
                                name="firstName"
                                placeholder="First Name"
                            />
                        </div>
                        <div className={cn("flex-flex-col gap-2")}>
                            <TextField
                                type={"text"}
                                label={"Last Name"}
                                name="lastName"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div className={cn("flex-flex-col gap-2")}>
                        <TextField type={"email"} label={"E-Mail Address"} name="email" placeholder="Email" />
                    </div>

                    <div className={cn("flex-flex-col gap-2")}>
                        <TextField name="password" label={"Password"} placeholder="Password" type="password" />
                    </div>
                </Form>
            </CardContent>
        </Card>
    )
}
