"use client"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import deleteAccount from "@/src/lib/model/account/mutations/deleteAccount"
import getAccount from "@/src/lib/model/account/queries/getAccount"
import DataItem from "@/src/lib/components/common/data/DataItem"
import Section from "@/src/lib/components/common/structure/Section"

export const Account = ({ accountId }: { accountId: string }) => {
    const router = useRouter()
    const [deleteAccountMutation] = useMutation(deleteAccount)
    const [account] = useQuery(getAccount, { id: accountId })

    return (
        <div className={"flex flex-col gap-12"}>
            <Section title={"Basic Information"}
                     subtitle={"Please find all information to the account below."}>

                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Name"}
                              data={account.name}
                              className={"basis-1/4"} />

                    <DataItem label={"Technical Name"}
                              data={account.technicalName}
                              className={"basis-1/4"} />
                </div>

            </Section>
        </div>
    )
}
