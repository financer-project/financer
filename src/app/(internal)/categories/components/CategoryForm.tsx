"use client"

import React, { useEffect, useState } from "react"

import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { CategoryType } from "@prisma/client"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { useCurrentHousehold, useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"
import ColorType from "@/src/lib/model/common/ColorType"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { Category } from ".prisma/client"
import { useSearchParams } from "next/navigation"

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CategoryForm = <S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) => {

    const searchParams = useSearchParams()
    const [parentCategory, setParentCategory] = useState<Category | null>(null)
    const categories = useCategories()

    useEffect(() => {
        if (parentCategory === null && (props.initialValues?.parentId || searchParams?.get("parentId"))) {
            handleParentChange(props.initialValues?.parentId || searchParams?.get("parentId"))
        }
    }, [props])

    const handleParentChange = (parentId: string | null) => {
        const selectedParent = categories.findNode((category) => category.id === parentId)
        setParentCategory(selectedParent?.data ?? null)
    }

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4"}>
                <SelectFormField<Category>
                    label={"Household"}
                    name={"householdId"}
                    readonly
                    value={useCurrentHousehold()?.id}
                    options={useHouseholds()?.map(household =>
                        ({ label: household.name, value: household.id })) ?? []} />
                <SelectFormField<Category>
                    label={"Parent Category"}
                    name={"parentId"}
                    options={categories
                        .flatten()
                        .sort((a, b) => a.data.name.localeCompare(b.data.name))
                        .filter(category => category.id !== props.initialValues?.id)
                        .map(category => ({
                            label: category.data.name,
                            value: category.id,
                            render: () => <ColoredTag label={category.data.name} color={category.data.color} />
                        }))}
                    onChange={(value) => handleParentChange(value as string)} />
            </div>
            <div className={"flex flex-row gap-4"}>
                <TextField<Category, string>
                    label={"Name"}
                    name={"name"}
                    required />
                <div className={"flex flex-row gap-4 flex-1 "}>
                    <SelectFormField<Category>
                        label={"Type"}
                        name={"type"}
                        required
                        value={parentCategory?.type}
                        options={[
                            { value: CategoryType.INCOME, label: "Income" },
                            { value: CategoryType.EXPENSE, label: "Expense" }
                        ]} />
                    <SelectFormField<Category>
                        label={"Color"}
                        name={"color"}
                        value={parentCategory?.color}
                        options={Object.values(ColorType).map(color => ({
                            value: color.toLowerCase(),
                            label: color.charAt(0).toUpperCase() + color.slice(1),
                            render: (label: string) => (<ColoredTag label={label} color={color} />)
                        }))}
                        readonly={parentCategory !== null} />
                </div>
            </div>
        </Form>
    )
}