"use client"
import { useQuery } from "@blitzjs/rpc"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import DataItem from "@/src/lib/components/common/data/DataItem"
import Section from "@/src/lib/components/common/structure/Section"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { Badge } from "@/src/lib/components/ui/badge"
import { useCounterparties } from "@/src/lib/components/provider/CounterpartyProvider"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"
import { DataItemContainer, DataItemGroup } from "@/src/lib/components/common/data/DataItemContainer"

export const Transaction = withFormatters(({ transactionId, formatters }: WithFormattersProps & {
    transactionId: string
}) => {
    const [transaction] = useQuery(getTransaction, { id: transactionId })
    const counterparties = useCounterparties()

    return (
        <div className={"flex flex-col gap-16"}>
            <Section title={"Basic Information"}
                     subtitle={"Please find all information to the transaction below."}
                     actions={
                         <span className={"font-mono text-xl tracking-tight"}>
                             {formatters.amount.format(transaction.amount)}
                         </span>
                     }>

                <DataItemContainer>
                    <DataItemGroup>
                        <DataItem label={"Name"}
                                  data={transaction.name} />

                        <DataItem label={"Type"}
                                  data={transaction.type} />

                        <DataItem label={"Value Date"}
                                  data={formatters.date.format(transaction.valueDate)} />
                    </DataItemGroup>

                    <DataItemGroup>
                        <DataItem label={"Account"}
                                  data={transaction.account.name}
                                  linkTo={`/households/${transaction.account.householdId}/accounts/${transaction.account.id}`} />

                        <DataItem label={"Category"}
                                  data={transaction.category &&
                                      <ColoredTag label={transaction.category.name}
                                                  color={transaction.category.color} />}
                                  linkTo={`/categories/${transaction.category?.id}`} />

                        <DataItem label={"Counterparty"}
                                  data={transaction.counterpartyId && (() => {
                                      const counterparty = counterparties.find(c => c.id === transaction.counterpartyId)
                                      return counterparty
                                          ? <CounterpartyIcon type={counterparty.type} name={counterparty.name} />
                                          : null
                                  })()}
                                  linkTo={transaction.counterpartyId ? `/counterparties/${transaction.counterpartyId}` : undefined} />

                        <DataItem label={"Tags"}
                                  data={
                                      <div className={"flex gap-2 py-1"}>
                                          {transaction.tags?.map(tag => (
                                              <Badge key={tag.tagId} variant={"secondary"}>
                                                  <ColoredTag label={tag.tag.name}
                                                              color={tag.tag.color} />
                                              </Badge>
                                          ))}
                                      </div>}
                                  linkTo={`/categories/${transaction.category?.id}`} />
                    </DataItemGroup>

                    <DataItem label={"Description"}
                              data={transaction.description}
                              className={"col-span-2"} />
                </DataItemContainer>
            </Section>

            <Section title={"Administrative Data"}
                     subtitle={"Administrative data contains information about who has changed what etc."}>
                <DataItemContainer>
                    <DataItem label={"Created At"}
                              data={formatters.date.format(transaction.createdAt)} />

                    <DataItem label={"Updated At"}
                              data={formatters.date.format(transaction.updatedAt)} />
                </DataItemContainer>
            </Section>
        </div>
    )
})
