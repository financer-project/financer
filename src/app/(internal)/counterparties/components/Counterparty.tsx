"use client"
import { useQuery } from "@blitzjs/rpc"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import Section from "@/src/lib/components/common/structure/Section"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer, DataItemWrapper } from "@/src/lib/components/common/data/DataItemContainer"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"

export const Counterparty = withFormatters(({ counterpartyId, formatters }: WithFormattersProps & {
    counterpartyId: string
}) => {
    const [counterparty] = useQuery(getCounterparty, { id: counterpartyId })

    return (
        <div>
            <Section title={"Basic Data"}
                     subtitle={"This is the basic data of the counterparty."}>

                <DataItemContainer>
                    <DataItemWrapper>
                        <DataItem label={"Name"}
                                  data={counterparty.name} />

                        <DataItem label={"Type"}
                                  data={<CounterpartyIcon type={counterparty.type}
                                                          name={formatters.capitalize.format(counterparty.type.toLowerCase().replace("_", " "))} />
                                  } />
                    </DataItemWrapper>

                    <DataItemWrapper>
                        <DataItem label={"Description"}
                                  data={counterparty.description} />

                        <DataItem label={"Account Name"}
                                  data={counterparty.accountName} />

                        <DataItem label={"Web Address"}
                                  data={counterparty.webAddress} />
                    </DataItemWrapper>
                </DataItemContainer>

            </Section>
            <Section title={"Administrative Data"}>
                <DataItemContainer>
                    <DataItem label={"Updated At"}
                              data={formatters.date.format(counterparty.updatedAt)} />

                    <DataItem label={"Created At"}
                              data={formatters.date.format(counterparty.createdAt)} />
                </DataItemContainer>
            </Section>
        </div>
    )
})
