import React, { Suspense } from "react"
import { Form, FormProps } from "@/src/lib/components/common/form/Form"
import { TextField } from "@/src/lib/components/common/form/TextField"

import { z } from "zod"
import SelectField from "@/src/lib/components/common/form/SelectField"
import currencyCodes from "currency-codes"

export { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function HouseholdForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <TextField name="name" label="Name" placeholder="Name" />
      <SelectField
        name="currency"
        label="Currency"
        placeholder="Currency"
        options={currencyCodes.data.map((value) => {
          return { value: value.code, label: `${value.currency} (${value.code})` }
        })}
      />
    </Form>
  )
}
