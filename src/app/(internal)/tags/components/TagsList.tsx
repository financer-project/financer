"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import getTags from "@/src/lib/model/tags/queries/getTags"
import { DataTable, useDataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { useAuthorize } from "@/src/lib/guard/hooks/useAuthorize"
import { Prisma } from "@prisma/client"

export const TagsList = withFormatters(({ formatters }: WithFormattersProps) => {
    const currentHousehold = useCurrentHousehold()!
    const { page, pageSize } = useDataTable({ defaultPageSize: 25 })
    const [{ tags, count }] = usePaginatedQuery(getTags, {
        skip: pageSize * page,
        take: pageSize,
        householdId: currentHousehold.id
    })

    const canCreateTag = useAuthorize("create", Prisma.ModelName.Tag, {}, true)

    return (
        <DataTable
            data={tags}
            columns={[
                { name: "Name", render: tag => tag.name, isKey: true },
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
            count={count}
            createRoute={canCreateTag ? "/tags/new" : undefined} />
    )
})