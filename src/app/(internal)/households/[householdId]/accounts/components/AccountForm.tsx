import React from "react"
import { z } from "zod"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import SelectField from "@/src/lib/components/common/form/elements/SelectField"
import { invoke } from "@/src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"


export async function AccountForm<S extends z.ZodType<any, any>>(
    props: FormProps<S> & { householdId: string }
) {
    const household = await invoke(getHousehold, {
        id: props.householdId
    })

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4 w-full"}>
                <SelectField label={"Household"}
                             name={"householdId"}
                             value={household.id}
                             options={[{ label: household.name, value: household.id }]} />
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
