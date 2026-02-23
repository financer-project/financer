"use client"

import React from "react"
import { z } from "zod"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import TextAreaField from "@/src/lib/components/common/form/elements/TextAreaField"
import AmountField from "@/src/lib/components/common/form/elements/AmountField"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import DatePickerFormField from "@/src/lib/components/common/form/elements/DatePickerFormField"
import { useAccounts, useDefaultAccountId } from "@/src/lib/components/provider/AccountProvider"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { useCounterparties } from "@/src/lib/components/provider/CounterpartyProvider"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"
import Section from "@/src/lib/components/common/structure/Section"
import { DateTime } from "luxon"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TransactionTemplateForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {
    const accounts = useAccounts()
    const defaultAccountId = useDefaultAccountId()
    const categories = useCategories()
    const counterparties = useCounterparties()

    return (
        <Form<S> {...props}>
            <Section title={"Basic Data"}>
                <div className={"flex flex-row gap-4"}>
                    <SelectFormField
                        label={"Account"}
                        name={"accountId"}
                        value={props.initialValues?.accountId ?? defaultAccountId ?? (accounts.length === 1 ? accounts[0].id : null)}
                        options={accounts
                            .toSorted((a, b) => a.name.localeCompare(b.name))
                            .map(account => ({ label: account.name, value: account.id }))}
                        required />
                </div>
                <div className={"flex flex-row gap-4"}>
                    <TextField
                        label={"Name"}
                        name={"name"}
                        required />

                    <SelectFormField
                        label={"Type"}
                        name={"type"}
                        required
                        options={[
                            { value: TransactionType.INCOME, label: "Income" },
                            { value: TransactionType.EXPENSE, label: "Expense" },
                            { value: TransactionType.TRANSFER, label: "Transfer" }
                        ]} />
                </div>
                <div className={"flex flex-row gap-4"}>
                    <AmountField
                        label={"Amount"}
                        name={"amount"}
                        required />

                    <SelectFormField
                        label={"Frequency"}
                        name={"frequency"}
                        required
                        options={[
                            { value: RecurrenceFrequency.DAILY, label: "Daily" },
                            { value: RecurrenceFrequency.WEEKLY, label: "Weekly" },
                            { value: RecurrenceFrequency.MONTHLY, label: "Monthly" },
                            { value: RecurrenceFrequency.YEARLY, label: "Yearly" }
                        ]} />
                </div>
                <div className={"flex flex-row gap-4"}>
                    <DatePickerFormField
                        name={"startDate"}
                        label={"Start Date"}
                        value={props.initialValues?.startDate ?? DateTime.now().toJSDate()}
                        required />

                    <DatePickerFormField
                        name={"endDate"}
                        label={"End Date (optional)"}
                        value={props.initialValues?.endDate ?? null} />
                </div>
            </Section>

            <Section title={"Details"}>
                <TextAreaField
                    label={"Description"}
                    name={"description"} />

                <div className={"flex flex-row gap-4"}>
                    <SelectFormField
                        label={"Category"}
                        name={"categoryId"}
                        options={categories
                            .flatten()
                            .sort((a, b) => a.data.name.localeCompare(b.data.name))
                            .map(category => ({
                                label: category.data.name,
                                value: category.data.id,
                                render: () => <ColoredTag label={category.data.name} color={category.data.color} />
                            }))} />

                    <SelectFormField
                        label={"Counterparty"}
                        name={"counterpartyId"}
                        options={counterparties
                            .toSorted((a, b) => a.name.localeCompare(b.name))
                            .map(counterparty => ({
                                label: counterparty.name,
                                value: counterparty.id,
                                render: () => <CounterpartyIcon type={counterparty.type} name={counterparty.name} />
                            }))} />
                </div>
            </Section>
        </Form>
    )
}
