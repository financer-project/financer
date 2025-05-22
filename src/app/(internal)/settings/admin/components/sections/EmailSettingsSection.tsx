import React from "react"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import { AdminSettings } from "@prisma/client"
import { Button } from "@/src/lib/components/ui/button"
import { Heading3 } from "@/src/lib/components/common/typography"

interface EmailSettingsSectionProps {
    onSendTestEmail?: (testEmailRecipient: string) => Promise<void>;
    isSendingTestEmail?: boolean;
    defaultTestEmailRecipient?: string;
}

const EmailSettingsSection: React.FC<EmailSettingsSectionProps> = ({
                                                                       onSendTestEmail,
                                                                       isSendingTestEmail,
                                                                       defaultTestEmailRecipient
                                                                   }) => {
    return (
        <>
            <div className={"grid grid-cols-2 gap-4"}>
                <TextField
                    name="smtpHost"
                    label="SMTP Host"
                    placeholder="smtp.example.com" />
                <TextField
                    name="smtpPort"
                    label="SMTP Port"
                    placeholder="587"
                    type="number" />
                <SelectFormField<AdminSettings>
                    label={"Encryption Type"}
                    name={"smtpEncryption"}
                    options={[
                        { value: "ssl", label: "SSL" },
                        { value: "tls", label: "TLS" },
                        { value: "starttls", label: "STARTTLS" }
                    ]}
                    description={"The type of encryption to use for SMTP."} />
                <div></div>
                <TextField
                    name="smtpUser"
                    label="SMTP Username"
                    placeholder="user@example.com" />
                <TextField
                    name="smtpPassword"
                    label="SMTP Password"
                    placeholder="password"
                    type="password" />
                <TextField
                    name="smtpFromEmail"
                    label="From Email"
                    placeholder="noreply@example.com" />
                <TextField
                    name="smtpFromName"
                    label="From Name"
                    placeholder="Financer App" />
            </div>
            {onSendTestEmail && (
                <div className={"flex flex-col gap-4"}>
                    <Heading3>Send Test Email</Heading3>
                    <div className="flex flex-row gap-2">
                        <TextField
                            name="testEmailRecipient"
                            label="Test Email Recipient"
                            placeholder="recipient@example.com"
                            description={"Enter the email address to send the test email to."}
                            value={defaultTestEmailRecipient} />
                        <Button
                            type="button"
                            variant="outline"
                            className={"mt-5.5"}
                            onClick={() => {
                                const recipientInput = document.querySelector("input[name=\"testEmailRecipient\"]") as HTMLInputElement
                                const recipient = recipientInput?.value ?? defaultTestEmailRecipient ?? ""
                                onSendTestEmail?.(recipient)
                            }}
                            disabled={isSendingTestEmail}>
                            {isSendingTestEmail ? "Sending..." : "Send Test Email"}
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}

export default EmailSettingsSection