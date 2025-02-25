import { BlitzPage } from "@blitzjs/auth"
import Header from "@/src/lib/components/content/nav/Header"
import BalanceChart from "@/src/app/(internal)/dashboard/components/BalanceChart"

export const dynamic = "force-dynamic"

const Dashboard: BlitzPage = async () => {
    return (
        <div>
            <Header title={"Dashboard"}
                    breadcrumbs={[
                        { label: "Dashboard" }
                    ]} />

            <div className={"flex flex-row w-full"}>
                <BalanceChart className={"max-h-96"} />
            </div>

        </div>
    )
}

export default Dashboard
