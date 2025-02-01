import React from "react"
import { Form, FormProps } from "@/src/lib/components/common/form/Form"
import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { z } from "zod"
import SelectField from "@/src/lib/components/common/form/elements/SelectField"
import currencyCodes from "currency-codes"
import TextAreaField from "@/src/lib/components/common/form/elements/TextAreaField"

export { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function HouseholdForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {
    return (
        <Form<S> {...props}>

            <div className={"flex flex-row gap-4 w-full"}>
                <TextField name="name"
                           label="Name"
                           placeholder="Name"
                           required />
                <SelectField
                    name="currency"
                    label="Currency"
                    placeholder="Currency"
                    required
                    options={currencyCodes.data.map((value) => {
                        return { value: value.code, label: `${value.currency} (${value.code})` }
                    })}
                />
            </div>
            <TextAreaField name={"description"}
                           label={"Description"}
                           placeholder={"Description"} />
        </Form>
    )
}