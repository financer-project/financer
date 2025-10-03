import { BlitzPage } from "@blitzjs/auth"
import {
    Page,
    PageActions,
    PageContent,
    PageDescription,
    PageHeader,
    PageTitle
} from "@/src/lib/components/content/page"
import BalanceChart from "@/src/app/(internal)/dashboard/components/BalanceChart"
import CategoryDistributionChart from "@/src/app/(internal)/dashboard/components/CategoryDistributionChart"
import DashboardClientWrapper, { TimeframeSelector } from "./components/DashboardClientWrapper"
import DashboardKPIs from "./components/DashboardKPIs"
import LatestTransactions from "./components/LatestTransactions"

export const dynamic = "force-dynamic"

const Dashboard: BlitzPage = async () => {
    return (
        <DashboardClientWrapper>
            <Page>
                <PageHeader items={[{ label: "Dashboard" }]}>
                    <PageTitle>Dashboard</PageTitle>
                    <PageDescription>See your financials at a glance</PageDescription>
                    <PageActions>
                        <TimeframeSelector />
                    </PageActions>
                </PageHeader>
                <PageContent>
                    <DashboardKPIs />

                    <div className={"grid grid-cols-4 gap-6"}>
                        <BalanceChart className={"col-span-4"} />
                        <CategoryDistributionChart className={"max-h-96 lg:col-span-1 col-span-4"} />
                        <LatestTransactions className={"max-h-96 lg:col-span-3 col-span-4"} />
                    </div>
                </PageContent>
            </Page>
        </DashboardClientWrapper>
    )
}

export default Dashboard
