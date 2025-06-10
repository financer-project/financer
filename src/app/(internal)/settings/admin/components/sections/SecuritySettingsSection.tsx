import React from "react"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Heading3 } from "@/src/lib/components/common/typography"

const SecuritySettingsSection: React.FC = () => {
    return (
        <div className={"flex flex-col gap-4"}>
            <Heading3>Token Expiration</Heading3>
            <div className={"grid grid-cols-2 gap-4"}>
                <TextField
                    name="invitationTokenExpirationHours"
                    label="Invitation Token Expiration (hours)"
                    placeholder="72"
                    type="number"
                    description="How long invitation tokens are valid (1-168 hours, default 72 hours / 3 days)"
                />
                <TextField
                    name="resetPasswordTokenExpirationHours"
                    label="Reset Password Token Expiration (hours)"
                    placeholder="4"
                    type="number"
                    description="How long password reset tokens are valid (1-24 hours, default 4 hours)"
                />
            </div>
        </div>
    )
}

export default SecuritySettingsSection