"use client"

import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { z } from "zod"

interface ProfileFormValues {
    firstName: string
    lastName: string
    email: string
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {
    return (
        <Form<S> {...props}>
            <div className={"flex flex-col gap-4"}>
                <div className={"flex flex-row gap-4"}>
                    <TextField<ProfileFormValues, string>
                        label={"First Name"}
                        name={"firstName"}
                        required
                    />
                    <TextField<ProfileFormValues, string>
                        label={"Last Name"}
                        name={"lastName"}
                        required
                    />
                </div>
                <TextField<ProfileFormValues, string>
                    label={"Email"}
                    name={"email"}
                    type={"email"}
                    required
                />
            </div>
        </Form>
    )
}
