import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import React from "react"

import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import { Settings } from "@prisma/client"
import Section from "@/src/lib/components/common/structure/Section"


export function SettingForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
    return (
        <Form<S> {...props}>
            <Section title={"General"} className={"mt-0"}>

                <div className={"flex flex-row gap-4"}>
                    <SelectFormField<Settings>
                        label={"Language"}
                        name={"language"}
                        options={[
                            { value: "en-US", label: "English (American)" },
                            { value: "de-DE", label: "German" }
                        ]}
                        description={"The language of the application."} />

                    <SelectFormField<Settings>
                        label={"Theme"}
                        name={"theme"}
                        options={[
                            { value: "dark", label: "Dark" },
                            { value: "light", label: "Light" }
                        ]}
                        description={"The theme of the application."} />
                </div>
            </Section>
        </Form>
    )
}
