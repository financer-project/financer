"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useSearchParams } from "next/navigation"
import getTags from "@/src/lib/model/tags/queries/getTags"
import { DataTable } from "@/src/lib/components/common/data/DataTable"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"

export const TagsList = withFormatters(({ formatters, itemsPerPage = 25 }: WithFormattersProps & {
    itemsPerPage?: number
}) => {
    const searchParams = useSearchParams()
    const currentHousehold = useCurrentHousehold()!
    const page = Number(searchParams?.get("page") ?? 0)
    const [{ tags, hasMore }] = usePaginatedQuery(getTags, {
        skip: itemsPerPage * page,
        take: itemsPerPage,
        householdId: currentHousehold.id
    })

    return (
        <DataTable
            data={tags}
            columns={[
                { name: "Name", render: tag => tag.name },
                {
                    name: "Color",
                    render: tag => tag.color ?
                        <ColoredTag color={tag.color} label={formatters.capitalize.format(tag.color)} /> :
                        <span className={"text-muted-foreground"}>No color</span>
                },
                {
                    name: "Description",
                    render: tag => tag.description ??
                        <span className={"text-muted-foreground"}>No description</span>
                },
                {
                    name: "Created",
                    render: tag => formatters.date.format(tag.createdAt)
                }
            ]}
            itemRoute={tag => `/tags/${tag.id}`}
            hasMore={hasMore}
            createRoute="/tags/new" />
    )
})