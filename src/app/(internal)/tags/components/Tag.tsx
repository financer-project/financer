"use client"
import { useQuery } from "@blitzjs/rpc"
import getTag from "@/src/lib/model/tags/queries/getTag"
import Section from "@/src/lib/components/common/structure/Section"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer } from "@/src/lib/components/common/data/DataItemContainer"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"

export const Tag = withFormatters(({ tagId, formatters }: WithFormattersProps & { tagId: string }) => {
    const [tag] = useQuery(getTag, { id: tagId })

    return (
        <div>
            <Section title={"Basic Data"}
                     subtitle={"This is the basic data of the tag."}>

                <DataItemContainer>
                    <DataItem label={"Name"}
                              data={tag.name} />

                    <DataItem label={"Description"}
                              data={tag.description ?? <span className="text-muted-foreground">No description</span>} />

                    <DataItem label={"Color"}
                              data={tag.color ?
                                  <ColoredTag label={formatters.capitalize.format(tag.color)}
                                              color={tag.color} /> :
                                  <span className="text-muted-foreground">No color</span>} />
                </DataItemContainer>

            </Section>
        </div>
    )
})