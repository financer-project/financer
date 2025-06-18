"use client"
import { useQuery } from "@blitzjs/rpc"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import Section from "@/src/lib/components/common/structure/Section"
import DataItem from "@/src/lib/components/common/data/DataItem"
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

                <div className={"flex flex-row w-full flex-wrap"}>
                    <DataItem label={"Name"}
                              className={"basis-1/4"}
                              data={counterparty.name} />

                    <DataItem label={"Type"}
                              className={"basis-1/4"}
                              data={<CounterpartyIcon type={counterparty.type}
                                                      name={formatters.capitalize.format(counterparty.type.toLowerCase().replace("_", " "))} />
                              } />


                </div>
                <div className={"flex flex-row w-full flex-wrap"}>
                    <DataItem label={"Description"}
                              className={"basis-1/4"}
                              data={counterparty.description} />

                    <DataItem label={"Account Name"}
                              className={"basis-1/4"}
                              data={counterparty.accountName} />

                    <DataItem label={"Web Address"}
                              className={"basis-1/4"}
                              data={counterparty.webAddress} />

                </div>

            </Section>
            <Section title={"Administrative Data"}>
                <div className={"flex flex-row w-full flex-wrap"}>

                    <DataItem label={"Updated At"}
                              className={"basis-1/4"}
                              data={formatters.date.format(counterparty.updatedAt)} />

                    <DataItem label={"Created At"}
                              className={"basis-1/4"}
                              data={formatters.date.format(counterparty.createdAt)} />
                </div>
            </Section>
        </div>
    )
})
