"use client"

import React from "react"
import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import { useCurrentHousehold, useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"
import ColorType from "@/src/lib/model/common/ColorType"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { Tag } from ".prisma/client"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TagForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {
    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4"}>
                <SelectFormField<Tag>
                    label={"Household"}
                    name={"householdId"}
                    readonly
                    value={useCurrentHousehold()?.id}
                    options={useHouseholds()?.map(household =>
                        ({ label: household.name, value: household.id })) ?? []} />
                <TextField<Tag, string>
                    label={"Name"}
                    name={"name"}
                    required />
            </div>
            <div className={"flex flex-row gap-4"}>

                <TextField<Tag, string>
                    label={"Description"}
                    name={"description"} />
                <SelectFormField<Tag>
                    label={"Color"}
                    name={"color"}
                    options={Object.values(ColorType).map(color => ({
                        value: color.toLowerCase(),
                        label: color.charAt(0).toUpperCase() + color.slice(1),
                        render: (label: string) => (<ColoredTag label={label} color={color} />)
                    }))} />
            </div>
        </Form>
    )
}