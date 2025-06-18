"use client"

import React from "react"
import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import { useCurrentHousehold, useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"
import { Counterparty, CounterpartyType } from "@prisma/client"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CounterpartyForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {
    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4"}>
                <SelectFormField<Counterparty>
                    label={"Household"}
                    name={"householdId"}
                    readonly
                    value={useCurrentHousehold()?.id}
                    options={useHouseholds()?.map(household =>
                        ({ label: household.name, value: household.id })) ?? []} />
                <TextField<Counterparty, string>
                    label={"Name"}
                    name={"name"}
                    required />
            </div>
            <div className={"flex flex-row gap-4"}>
                <SelectFormField<Counterparty>
                    label={"Type"}
                    name={"type"}
                    required
                    options={Object.values(CounterpartyType).map(type => ({
                        value: type,
                        label: type.charAt(0) + type.slice(1).toLowerCase().replace("_", " "),
                        render: (label) => <CounterpartyIcon name={label} type={type} />
                    }))} />
                <TextField<Counterparty, string>
                    label={"Description"}
                    name={"description"} />
            </div>
            <div className={"flex flex-row gap-4"}>
                <TextField<Counterparty, string>
                    label={"Account Name"}
                    name={"accountName"} />
                <TextField<Counterparty, string>
                    label={"Web Address"}
                    name={"webAddress"} />
            </div>
        </Form>
    )
}