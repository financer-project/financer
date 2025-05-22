"use client"

import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import React from "react"
import { z } from "zod"
import SectionContainer from "@/src/lib/components/common/structure/SectionContainer"
import DefaultSettingsSection from "./sections/DefaultSettingsSection"
import UserManagementSection from "./sections/UserManagementSection"
import EmailSettingsSection from "./sections/EmailSettingsSection"
import Section from "@/src/lib/components/common/structure/Section"

interface AdminSettingsFormProps<S extends z.ZodType<any, any>> extends FormProps<S> { //eslint-disable-line @typescript-eslint/no-explicit-any
    onSendTestEmail?: (testEmailRecipient: string) => Promise<void>;
    isSendingTestEmail?: boolean;
    defaultTestEmailRecipient?: string;
}

export function AdminSettingsForm<S extends z.ZodType<any, any>>(props: Readonly<AdminSettingsFormProps<S>>) { //eslint-disable-line @typescript-eslint/no-explicit-any
    return (
        <SectionContainer>
            <Form<S> {...props}>
                <Section title={"Default Settings"}>
                    <DefaultSettingsSection />
                </Section>

                <Section title={"User Management & Settings"}>
                    <UserManagementSection />
                </Section>

                <Section title={"Email Settings (SMTP)"}>
                    <EmailSettingsSection
                        onSendTestEmail={props.onSendTestEmail}
                        isSendingTestEmail={props.isSendingTestEmail}
                        defaultTestEmailRecipient={props.defaultTestEmailRecipient}
                    />
                </Section>
            </Form>
        </SectionContainer>
    )
}
