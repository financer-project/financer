import { Metadata } from "next"
import { SidebarProvider } from "@/src/lib/components/ui/sidebar"
import { BlitzLayout } from "@blitzjs/next"
import AppSidebar from "@/src/lib/components/content/nav/sidebar/AppSidebar"
import { ScrollArea, ScrollBar } from "@/src/lib/components/ui/scroll-area"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"
import { invoke } from "src/app/blitz-server"
import getSetting from "@/src/lib/model/settings/queries/getSetting"
import Theme from "@/src/app/(internal)/theme"
import getCurrentUser from "@/src/lib/model/auth/queries/getCurrentUser"
import checkOnboardingStatus from "@/src/lib/model/onboarding/queries/checkOnboardingStatus"
import { redirect } from "next/navigation"
import { Dialog } from "@/src/lib/components/ui/dialog"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { RequireHouseholdDialog } from "./RequireHouseholdDialog"
import Link from "next/link"
import { Dot } from "lucide-react"

export const dynamic = "force-dynamic"

async function fetchUser() {
    return invoke(getCurrentUser, {})
}

async function fetchSettings() {
    return invoke(getSetting, {})
}

async function fetchOnboardingStatus() {
    return invoke(checkOnboardingStatus, {})
}

async function fetchCurrentHousehold() {
    return invoke(getCurrentHousehold, null)
}

export const metadata: Metadata = {
    title: {
        default: "Dashboard",
        template: "%s – Financer"
    },
    description: "Dashboard"
}

const RootLayout: BlitzLayout = async ({ children }: { children: React.ReactNode }) => {
    const currentUser = await fetchUser()
    if (!currentUser) {
        redirect("/login")
    }

    // Check if onboarding is needed and redirect if necessary
    const onboardingStatus = await fetchOnboardingStatus()
    if (onboardingStatus.needsOnboarding) {
        redirect("/onboarding")
    }

    const settings = await fetchSettings()
    const currentHousehold = await fetchCurrentHousehold()

    return (
        <div>
            <Dialog></Dialog>
            <Theme theme={settings.theme} />
            <HouseholdProvider>
                {!currentHousehold && <RequireHouseholdDialog />}
                <SidebarProvider>
                    <AppSidebar />
                    <main className={"flex flex-col w-full h-screen bg-sidebar md:p-4 p-0"}>
                        <div className={"bg-background md:rounded-xl h-full max-h-full"}>
                            <ScrollArea
                                className={"h-full overflow-y-auto md:rounded-xl flex flex-col justify-start"}>
                                {currentHousehold ? children : undefined}
                                <ScrollBar orientation="vertical" className={"pl-2"} />
                            </ScrollArea>
                        </div>
                        <div
                            className={"md:flex hidden gap-2 text-xs text-muted-foreground mt-2 mr-2 -mb-1 justify-end items-center"}>
                            <Link href={"https://financer-project.org/"}>
                                © {new Date().getFullYear()} Financer
                            </Link>
                            <Dot className={"w-4"} />
                            <Link
                                href={`https://github.com/financer-project/financer/releases/tag/v${process.env.npm_package_version}`}>
                                v{process.env.npm_package_version}
                            </Link>
                            <Dot className={"w-4"} />
                            <Link href={"https://github.com/financer-project/financer/"}>GitHub</Link>
                        </div>
                    </main>
                </SidebarProvider>
            </HouseholdProvider>
        </div>
    )
}

RootLayout.authenticate = { redirectTo: "/login" }

export default RootLayout
