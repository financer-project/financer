"use client"

import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import React from "react"
import { z } from "zod"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Transaction, TransactionType } from "@prisma/client"
import TextAreaField from "@/src/lib/components/common/form/elements/TextAreaField"
import { CategoryModel } from "@/src/lib/model/categories/queries/getCategory"
import SelectField from "@/src/lib/components/common/form/elements/SelectField"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { useAccounts } from "@/src/lib/components/provider/AccountProvider"

export function TransactionForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
    const accounts = useAccounts()
    const categories = useCategories()

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4"}>
                <SelectField<Transaction>
                    label={"Account"}
                    name={"accountId"}
                    options={accounts
                        .toSorted((a, b) => a.name.localeCompare(b.name))
                        .map(account => ({ label: account.name, value: account.id }))} />

                <SelectField<Transaction>
                    label={"Category"}
                    name={"categoryId"}
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
            </div>

            <div className={"flex flex-row gap-4"}>
                <SelectField<CategoryModel>
                    label={"Type"}
                    name={"type"}
                    required
                    options={[
                        { value: TransactionType.INCOME, label: "Income" },
                        { value: TransactionType.EXPENSE, label: "Expense" }
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
