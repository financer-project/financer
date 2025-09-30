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

                <div className={"grid lg:grid-cols-4 grid-cols-1"}>
                    <DataItem label={"Name"}
                              data={category.name} />

                    <DataItem label={"Description"}
                              data={category.description} />

                    <DataItem label={"Color"}
                              data={category.color &&
                                  <ColoredTag label={formatters.capitalize.format(category.color)}
                                              color={category.color} />} />
                </div>

            </Section>
        </div>
    )
})