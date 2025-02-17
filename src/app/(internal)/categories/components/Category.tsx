"use client"
import { useQuery } from "@blitzjs/rpc"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import Section from "@/src/lib/components/common/structure/Section"
import DataItem from "@/src/lib/components/common/data/DataItem"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"

export const Category = withFormatters(({ categoryId, formatters }: WithFormattersProps & { categoryId: string }) => {
    const [category] = useQuery(getCategory, { id: categoryId })

    return (
        <div>
            <Section title={"Basic Data"}
                     subtitle={"This is the basic data of the category."}>

                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Name"}
                              className={"basis-1/4"}
                              data={category.name} />

                    <DataItem label={"Description"}
                              className={"basis-1/4"}
                              data={category.description} />

                    <DataItem label={"Color"}
                              className={"basis-1/4"}
                              data={category.color &&
                                  <ColoredTag label={formatters.capitalize.format(category.color)}
                                              color={category.color} />} />
                </div>

            </Section>
        </div>
    )
})