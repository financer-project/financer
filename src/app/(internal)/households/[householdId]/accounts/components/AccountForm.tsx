import React from "react"
import { z } from "zod"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import SelectField from "@/src/lib/components/common/form/elements/SelectField"

export async function AccountForm<S extends z.ZodType<any, any>>(props: FormProps<S> & {
    households: { id: string, name: string }[]
}) {

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4 w-full"}>
                <SelectField label={"Household"}
                             name={"householdId"}
                             readonly
                             options={props.households.map((household) => ({
                                 value: household.id,
                                 label: household.name
                             }))} />
                <TextField label={"Name"}
                           name={"name"}
                           placeholder={"Name"}
                           required />
                <TextField label={"Technical Name"}
                           name={"technicalName"}
                           placeholder={"Technical Name"} />
            </div>
        </Form>
    )
}