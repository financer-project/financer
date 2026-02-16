import React from "react"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import { AdminSettings } from "@prisma/client"

const DefaultSettingsSection: React.FC = () => {
    return (
        <div className={"flex flex-row gap-4"}>
            <SelectFormField<AdminSettings>
                label={"Default Language"}
                name={"defaultLanguage"}
                options={[
                    { value: "en-US", label: "English (American)" },
                    { value: "de-DE", label: "German" }
                ]}
                description={"The default language for new users."} />

            <SelectFormField<AdminSettings>
                label={"Default Theme"}
                name={"defaultTheme"}
                options={[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                    { value: "system", label: "System" }
                ]}
                description={"The default theme for new users."} />
        </div>
    )
}

export default DefaultSettingsSection