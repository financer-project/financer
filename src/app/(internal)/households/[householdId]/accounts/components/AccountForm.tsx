import React from "react"
import { z } from "zod"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function AccountForm<S extends z.ZodType<any, any>>(props: FormProps<S> & {
    households: { id: string, name: string }[]
}) {

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4 w-full"}>
                <SelectFormField label={"Household"}
                                 name={"householdId"}
                                 options={props.households.map((household) => ({
                                 value: household.id,
                                 label: household.name
                             }))} />
            </div>
            <div className={"flex flex-row gap-4 w-full"}>
                <TextField label={"Name"}
                           name={"name"}
                           placeholder={"Name"}
                           required />
                <TextField label={"Technical Name"}
                           name={"technicalName"}
                           placeholder={"Technical Name"}
                description={"This can be an IBAN or an E-Mail Address."}/>
            </div>
        </Form>
    )
}