import { BlitzPage } from "@blitzjs/auth"
import Header from "@/src/lib/components/content/nav/Header"
import BalanceChart from "@/src/app/(internal)/dashboard/components/BalanceChart"
import CategoryDistributionChart from "@/src/app/(internal)/dashboard/components/CategoryDistributionChart"
import DashboardClientWrapper, { TimeframeSelector } from "./components/DashboardClientWrapper"
import DashboardKPIs from "./components/DashboardKPIs"

export const dynamic = "force-dynamic"

const Dashboard: BlitzPage = async () => {
    return (
        <DashboardClientWrapper>
            <div>
                <Header
                    title={"Dashboard"}
                    breadcrumbs={[{ label: "Dashboard" }]}
                    actions={<div><TimeframeSelector /></div>} />

                <DashboardKPIs />

                <div className={"flex flex-col gap-6 w-full"}>
                    <BalanceChart className={"max-h-96 w-full"} />
                    <CategoryDistributionChart className={"max-h-96 xl:w-1/3 lg:w-1/2 w-full"} />
                </div>
            </div>
        </DashboardClientWrapper>
    )
}

export default Dashboard
