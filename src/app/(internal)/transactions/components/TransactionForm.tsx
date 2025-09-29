"use client"

import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import React, { useState } from "react"
import { z } from "zod"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Transaction, TransactionType } from "@prisma/client"
import TextAreaField from "@/src/lib/components/common/form/elements/TextAreaField"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { useAccounts } from "@/src/lib/components/provider/AccountProvider"
import { useTags } from "@/src/lib/components/provider/TagProvider"
import { useCounterparties } from "@/src/lib/components/provider/CounterpartyProvider"
import DatePickerFormField from "@/src/lib/components/common/form/elements/DatePickerFormField"
import { DateTime } from "luxon"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import Section from "@/src/lib/components/common/structure/Section"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TransactionForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {

    const accounts = useAccounts()
    const categories = useCategories()
    const tags = useTags()
    const counterparties = useCounterparties()

    const [transactionType, setTransactionType] = useState<TransactionType | null>(props.initialValues?.type ?? null)

    const onCategorySelect = (categoryId: string | null) => {
        const category = categories.findNode((category) => category.id === categoryId)
        if (category) {
            setTransactionType(category.data.type as TransactionType)
        }
    }

    return (
        <Form<S> {...props}>
            <Section title={"Basic Data"}>
                <div className={"flex flex-row gap-4"}>
                    <SelectFormField<Transaction>
                        label={"Account"}
                        name={"accountId"}
                        value={props.initialValues?.accountId ?? accounts.length === 1 ? accounts[0].id : null}
                        options={accounts
                            .toSorted((a, b) => a.name.localeCompare(b.name))
                            .map(account => ({ label: account.name, value: account.id }))}
                        required />
                </div>
                <div className={"flex flex-row gap-4"}>
                    <TextField<Transaction, string>
                        label={"Name"}
                        name={"name"} />

                    <DatePickerFormField<Transaction>
                        name={"valueDate"}
                        label={"Value Date"}
                        value={DateTime.now().toJSDate()}
                        required />
                </div>

                <div className={"flex flex-row gap-4"}>
                    <SelectFormField<Transaction>
                        label={"Type"}
                        name={"type"}
                        value={transactionType}
                        required
                        options={[
                            { value: TransactionType.INCOME, label: "Income" },
                            { value: TransactionType.EXPENSE, label: "Expense" },
                            { value: TransactionType.TRANSFER, label: "Transfer" }
                        ]} />

                    <TextField<Transaction, string>
                        label={"Amount"}
                        name={"amount"}
                        type={"number"}
                        required />
                </div>

            </Section>

            <Section title={"Details"}>

                <TextAreaField<Transaction>
                    label={"Description"}
                    name={"description"}
                    required />

                <div className={"flex flex-row gap-4"}>
                    <SelectFormField<Transaction, string>
                        label={"Category"}
                        name={"categoryId"}
                        onChange={onCategorySelect}
                        options={categories
                            .flatten()
                            .sort((a, b) => a.data.name.localeCompare(b.data.name))
                            .map(category => ({
                                label: category.data.name,
                                value: category.data.id,
                                render: () => <ColoredTag label={category.data.name} color={category.data.color} />
                            }))} />
                    <SelectFormField<Transaction, string>
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
                <SelectFormField
                    label={"Tags"}
                    name={"tagIds"}
                    multiple={true}
                    options={tags
                        .toSorted((a, b) => a.name.localeCompare(b.name))
                        .map(tag => ({
                            label: tag.name,
                            value: tag.id,
                            render: () => (
                                <ColoredTag label={tag.name} color={tag.color} />
                            )
                        }))} />
            </Section>
        </Form>
    )
}
