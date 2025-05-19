"use client"

import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import React from "react"
import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import Section from "@/src/lib/components/common/structure/Section"
import { AdminSettings } from "@prisma/client"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Button } from "@/src/lib/components/ui/button"
import SwitchField from "@/src/lib/components/common/form/elements/SwitchField"

interface AdminSettingsFormProps<S extends z.ZodType<any, any>> extends FormProps<S> { //eslint-disable-line @typescript-eslint/no-explicit-any
    onSendTestEmail?: (testEmailRecipient: string) => Promise<void>;
    isSendingTestEmail?: boolean;
    defaultTestEmailRecipient?: string;
}

export function AdminSettingsForm<S extends z.ZodType<any, any>>(props: Readonly<AdminSettingsFormProps<S>>) { //eslint-disable-line @typescript-eslint/no-explicit-any
    return (
        <Form<S> {...props}>
            <Section title={"Default Settings"}>
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
                            { value: "dark", label: "Dark" },
                            { value: "light", label: "Light" }
                        ]}
                        description={"The default theme for new users."} />
                </div>
            </Section>

            <Section title={"Registration Settings"}>
                <div className={"flex flex-col gap-4 w-1/2"}>
                    <SwitchField
                        name={"allowRegistration"}
                        label={"Allow new user registration"}
                        description={"When checked, users can register themselves without an invitation code."} />
                </div>
            </Section>

            <Section title={"Email Settings (SMTP)"}>
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
                {props.onSendTestEmail && (
                    <div className="mt-4">
                        <div className="mb-2">
                            <TextField
                                name="testEmailRecipient"
                                label="Test Email Recipient"
                                placeholder="recipient@example.com"
                                value={props.defaultTestEmailRecipient}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const recipientInput = document.querySelector("input[name=\"testEmailRecipient\"]") as HTMLInputElement
                                const recipient = recipientInput?.value || props.defaultTestEmailRecipient || ""
                                props.onSendTestEmail?.(recipient)
                            }}
                            disabled={props.isSendingTestEmail}>
                            {props.isSendingTestEmail ? "Sending..." : "Send Test Email"}
                        </Button>
                    </div>
                )}
            </Section>
        </Form>
    )
}
