"use client"

import React, { useState } from "react"

import { z } from "zod"
import SelectFormField from "@/src/lib/components/common/form/elements/SelectFormField"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { CategoryType } from "@prisma/client"
import Form, { FormProps } from "@/src/lib/components/common/form/Form"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { useCurrentHousehold, useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"
import { CategoryModel } from "@/src/lib/model/categories/queries/getCategory"
import ColorType from "@/src/lib/model/common/ColorType"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"


export function CategoryForm<S extends z.ZodType<any, any>>(props: Readonly<FormProps<S>>) {

    const [parentType, setParentType] = useState<CategoryType | null>(null)
    const categories = useCategories()

    const handleParentChange = (parentId: string | null) => {
        if (parentId) {
            const selectedParent = categories.findNode((category) => category.id === parentId)
            if (selectedParent) {
                setParentType(selectedParent.type)
            }
        } else {
            setParentType(null)
        }
    }

    return (
        <Form<S> {...props}>
            <div className={"flex flex-row gap-4"}>
                <SelectFormField<CategoryModel>
                    label={"Household"}
                    name={"householdId"}
                    readonly
                    value={useCurrentHousehold()?.id}
                    options={useHouseholds()?.map(household =>
                        ({ label: household.name, value: household.id })) ?? []} />
                <SelectFormField<CategoryModel>
                    label={"Parent Category"}
                    name={"parentId"}
                    options={categories
                        .flatten()
                        .filter(category => category.id !== props.id)
                        .map(category => ({ label: category.name, value: category.id }))}
                    onChange={(value) => handleParentChange(value as string)} />
            </div>
            <div className={"flex flex-row gap-4"}>
                <TextField<CategoryModel, string>
                    label={"Name"}
                    name={"name"}
                    required />
                <div className={"flex flex-row gap-4 flex-1 "}>
                    <SelectFormField<CategoryModel>
                        label={"Type"}
                        name={"type"}
                        required
                        value={parentType?.toString()}
                        options={[
                            { value: CategoryType.INCOME, label: "Income" },
                            { value: CategoryType.EXPENSE, label: "Expense" }
                        ]} />
                    <SelectFormField label={"Color"}
                                     name={"color"}
                                     options={Object.values(ColorType).map(color => ({
                                         value: color.toLowerCase(),
                                         label: color.charAt(0).toUpperCase() + color.slice(1),
                                         render: (label: string) => (<ColoredTag label={label} color={color} />)
                                     }))} />
                </div>
            </div>
        </Form>
    )
}
