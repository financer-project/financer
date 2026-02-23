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
import { DataItemContainer, DataItemWrapper } from "@/src/lib/components/common/data/DataItemContainer"
import { AttachmentList } from "./AttachmentList"
import { UserAvatar } from "@/src/lib/components/content/user"

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
                <DataItemWrapper>
                    <DataItemContainer>
                        <DataItem label={"Name"}
                                  data={transaction.name} />

                        <DataItem label={"Type"}
                                  data={transaction.type} />

                        <DataItem label={"Value Date"}
                                  data={formatters.date.format(transaction.valueDate)} />
                    </DataItemContainer>

                    <DataItemContainer>
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
                                      (<div className={"flex gap-2 py-1"}>
                                          {transaction.tags?.map(tag => (
                                              <Badge key={tag.tagId} variant={"secondary"}>
                                                  <ColoredTag label={tag.tag.name}
                                                              color={tag.tag.color} />
                                              </Badge>
                                          ))}
                                      </div>)} />
                    </DataItemContainer>

                    <DataItem label={"Description"}
                              data={transaction.description}
                              className={"col-span-2"} />
                </DataItemWrapper>
            </Section>

            <AttachmentList transactionId={transaction.id} attachments={transaction.attachments} formatters={formatters} />

            <Section title={"Administrative Data"}
                     subtitle={"Administrative data contains information about who has changed what etc."}>
                <DataItemContainer>
                    <DataItem label={"Created At"}
                              data={formatters.date.format(transaction.createdAt)} />

                    <DataItem label={"Updated At"}
                              data={formatters.date.format(transaction.updatedAt)} />

                    <DataItem label={"Created By"}
                              data={
                                  <UserAvatar
                                      user={transaction.createdBy}
                                      size="sm"
                                      showName
                                      showTooltip={false}
                                  />
                              } />

                    <DataItem label={"Recurring Template"}
                              data={transaction.transactionTemplate?.name ?? null}
                              linkTo={transaction.transactionTemplateId
                                  ? `/transaction-templates/${transaction.transactionTemplateId}`
                                  : undefined} />
                </DataItemContainer>
            </Section>
        </div>
    )
})
