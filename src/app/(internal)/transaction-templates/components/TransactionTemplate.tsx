"use client"

import { useMutation, useQuery } from "@blitzjs/rpc"
import getTransactionTemplate from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplate"
import toggleTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/toggleTransactionTemplate"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import DataItem from "@/src/lib/components/common/data/DataItem"
import Section from "@/src/lib/components/common/structure/Section"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { Switch } from "@/src/lib/components/ui/switch"
import { Label } from "@/src/lib/components/ui/label"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"
import { DataItemContainer, DataItemWrapper } from "@/src/lib/components/common/data/DataItemContainer"
import { TransactionsList } from "@/src/app/(internal)/transactions/components/TransactionsList"
import { RecurrenceFrequency } from "@prisma/client"

const frequencyLabel: Record<RecurrenceFrequency, string> = {
    [RecurrenceFrequency.DAILY]: "Daily",
    [RecurrenceFrequency.WEEKLY]: "Weekly",
    [RecurrenceFrequency.MONTHLY]: "Monthly",
    [RecurrenceFrequency.YEARLY]: "Yearly"
}

export const TransactionTemplate = withFormatters(({ templateId, formatters }: WithFormattersProps & {
    templateId: string
}) => {
    const [template, { setQueryData }] = useQuery(getTransactionTemplate, { id: templateId })
    const [toggleMutation] = useMutation(toggleTransactionTemplate)

    return (
        <div className={"flex flex-col gap-16"}>
            <Section title={"Template Information"}
                     subtitle={"Details of the recurring transaction template."}
                     actions={
                         <div className={"flex items-center gap-2"}>
                             <Switch
                                 id={"template-active"}
                                 checked={template.isActive}
                                 onCheckedChange={async (checked) => {
                                     const updated = await toggleMutation({ id: template.id, isActive: checked })
                                     setQueryData({ ...template, isActive: updated.isActive })
                                 }} />
                             <Label htmlFor={"template-active"}>
                                 {template.isActive ? "Active" : "Inactive"}
                             </Label>
                         </div>
                     }>
                <DataItemWrapper>
                    <DataItemContainer>
                        <DataItem label={"Name"} data={template.name} />
                        <DataItem label={"Type"} data={template.type} />
                        <DataItem label={"Amount"}
                                  data={
                                      <span className={"font-mono"}>
                                          {formatters.amount.format(template.amount)}
                                      </span>
                                  } />
                    </DataItemContainer>
                    <DataItemContainer>
                        <DataItem label={"Frequency"} data={frequencyLabel[template.frequency]} />
                        <DataItem label={"Start Date"} data={formatters.date.format(template.startDate)} />
                        <DataItem label={"End Date"}
                                  data={template.endDate
                                      ? formatters.date.format(template.endDate)
                                      : <span className={"text-muted-foreground"}>No end date</span>
                                  } />
                        <DataItem label={"Next Due Date"} data={formatters.date.format(template.nextDueDate)} />
                    </DataItemContainer>
                    <DataItemContainer>
                        <DataItem label={"Account"}
                                  data={template.account.name}
                                  linkTo={`/households/${template.account.householdId}/accounts/${template.account.id}`} />
                        <DataItem label={"Category"}
                                  data={template.category &&
                                      <ColoredTag label={template.category.name} color={template.category.color} />
                                  }
                                  linkTo={template.category ? `/categories/${template.category.id}` : undefined} />
                        <DataItem label={"Counterparty"}
                                  data={template.counterparty &&
                                      <CounterpartyIcon type={template.counterparty.type}
                                                        name={template.counterparty.name} />
                                  }
                                  linkTo={template.counterparty ? `/counterparties/${template.counterparty.id}` : undefined} />
                    </DataItemContainer>
                    <DataItem label={"Description"}
                              data={template.description ?? <span className={"text-muted-foreground"}>No description</span>}
                              className={"col-span-2"} />
                </DataItemWrapper>
            </Section>

            <Section title={"Generated Transactions"}
                     subtitle={"Transactions generated from this template."}>
                <TransactionsList fixedFilters={{ transactionTemplateId: template.id }} />
            </Section>
        </div>
    )
})
