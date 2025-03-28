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
import DatePickerFormField from "@/src/lib/components/common/form/elements/DatePickerFormField"
import { DateTime } from "luxon"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TransactionForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {

    const accounts = useAccounts()
    const categories = useCategories()

    const [transactionType, setTransactionType] = useState<TransactionType | null>(null)

    const onCategorySelect = (categoryId: string | null) => {
        const category = categories.findNode((category) => category.id === categoryId)
        if (category) {
            setTransactionType(category.type as TransactionType)
        }
    }

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4"}>
                <SelectFormField<Transaction>
                    label={"Account"}
                    name={"accountId"}
                    options={accounts
                        .toSorted((a, b) => a.name.localeCompare(b.name))
                        .map(account => ({ label: account.name, value: account.id }))} />

                <SelectFormField<Transaction, string>
                    label={"Category"}
                    name={"categoryId"}
                    onChange={onCategorySelect}
                    options={categories
                        .flatten()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(category => ({ label: category.name, value: category.id }))} />
            </div>
            <div className={"flex flex-row gap-4"}>
                <TextField<Transaction, string>
                    label={"Name"}
                    name={"name"}
                    required />

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

            <TextAreaField<Transaction>
                label={"Description"}
                name={"description"}
                required />
        </Form>
    )
}
