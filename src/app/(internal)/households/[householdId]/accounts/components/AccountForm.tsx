import React from "react"

import { z } from "zod"
import { usePaginatedQuery } from "@blitzjs/rpc"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"


export function AccountForm<S extends z.ZodType<any, any>>(
    props: FormProps<S>
) {
    const [{
        households: households
    }] = usePaginatedQuery(getHouseholds, {
        orderBy: {
            id: "asc"
        }
    })

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4 w-full"}>
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
