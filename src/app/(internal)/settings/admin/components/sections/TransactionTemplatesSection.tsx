import React from "react"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { AdminSettings } from "@prisma/client"

const TransactionTemplatesSection: React.FC = () => {
    return (
        <div className={"flex flex-row gap-4"}>
            <TextField<AdminSettings, string>
                label={"Daily execution time"}
                name={"transactionTemplateCronTime"}
                type="time"
                description={"Time of day (HH:mm) when recurring transaction templates are processed."} />
        </div>
    )
}

export default TransactionTemplatesSection
