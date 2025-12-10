"use client"

import React from "react"
import { z } from "zod"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import { $Enums, HouseholdRole } from "@prisma/client"

export const HouseholdMemberSchema = z.object({
    email: z.email(),
    role: z.enum($Enums.HouseholdRole),
    accessLevel: z.enum($Enums.AccessLevel)
})

type formType = z.infer<typeof HouseholdMemberSchema>

export function HouseholdMemberForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) { //eslint-disable-line @typescript-eslint/no-explicit-any

    const roleOptions = Object.values($Enums.HouseholdRole)
        .filter(role => role !== HouseholdRole.OWNER)
        .map((role) => ({ value: role, label: role }))

    const accessOptions = Object.values($Enums.AccessLevel)
        .map((accessLevel) => ({ value: accessLevel, label: accessLevel }))

    return (
        <Form<S> {...props}>
            <div className="flex flex-col gap-4">
                <TextField<formType, string>
                    label={"Email"}
                    name={"email"}
                    required
                    placeholder="user@example.com"
                    readonly={props.initialValues?.email} />

                <div className="flex flex-row gap-4">
                    <SelectFormField<formType>
                        label={"Role"}
                        name={"role"}
                        options={roleOptions} />

                    <SelectFormField<formType>
                        label={"Access level"}
                        name={"accessLevel"}
                        options={accessOptions}
                    />
                </div>
            </div>
        </Form>
    )
}
