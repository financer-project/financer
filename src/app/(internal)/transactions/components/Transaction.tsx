"use client"
import { useQuery } from "@blitzjs/rpc"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import DataItem from "@/src/lib/components/common/data/DataItem"
import Section from "@/src/lib/components/common/structure/Section"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"

export const Transaction = withFormatters(({ transactionId, formatters }: WithFormattersProps & {
    transactionId: string
}) => {
    const [transaction] = useQuery(getTransaction, { id: transactionId })

    return (
        <div className={"flex flex-col gap-16"}>
            <Section title={"Basic Information"}
                     subtitle={"Please find all information to the transaction below."}
                     actions={
                         <span className={"font-semibold text-lg tracking-tight"}>
                             {formatters.amount.format(transaction.amount)}
                         </span>
                     }>

                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Account"}
                              data={transaction.account.name}
                              linkTo={`/households/${transaction.account.householdId}/accounts/${transaction.account.id}`}
                              className={"basis-1/4"} />

                    <DataItem label={"Category"}
                              data={transaction.category &&
                                  <ColoredTag label={transaction.category.name}
                                              color={transaction.category.color} />}
                              linkTo={`/categories/${transaction.category?.id}`}
                              className={"basis-1/4"} />
                </div>

                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Name"}
                              data={transaction.name}
                              className={"basis-1/4"} />

                    <DataItem label={"Type"}
                              data={transaction.type}
                              className={"basis-1/4"} />

                    <DataItem label={"Description"}
                              data={transaction.description}
                              className={"basis-1/2"} />
                </div>
            </Section>

            <Section title={"Administrative Data"}
                     subtitle={"Adminstrative data contains information about who has changed what etc."}>
                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Created At"}
                              data={formatters.date.format(transaction.createdAt)}
                              className={"basis-1/4"} />

                    <DataItem label={"Updated At"}
                              data={formatters.date.format(transaction.updatedAt)}
                              className={"basis-1/2"} />
                </div>
            </Section>
        </div>
    )
})
