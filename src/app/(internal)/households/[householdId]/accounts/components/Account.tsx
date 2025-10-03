"use client"
import { useQuery } from "@blitzjs/rpc"
import getAccount from "@/src/lib/model/account/queries/getAccount"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer } from "@/src/lib/components/common/data/DataItemContainer"
import Section from "@/src/lib/components/common/structure/Section"

export const Account = ({ accountId }: { accountId: string }) => {
    const [account] = useQuery(getAccount, { id: accountId })

    return (
        <div className={"flex flex-col gap-12"}>
            <Section title={"Basic Information"}
                     subtitle={"Please find all information to the account below."}>

                <DataItemContainer>
                    <DataItem label={"Household"}
                              data={account.household.name}
                              linkTo={`/households/${account.household.id}`} />

                    <DataItem label={"Name"}
                              data={account.name} />

                    <DataItem label={"Technical Name"}
                              data={account.technicalIdentifier} />
                </DataItemContainer>

            </Section>
        </div>
    )
}
