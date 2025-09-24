import { Metadata } from "next"
import { SidebarInset, SidebarProvider } from "@/src/lib/components/ui/sidebar"
import { BlitzLayout } from "@blitzjs/next"
import Sidebar from "@/src/lib/components/content/nav/sidebar/Sidebar"
import { ScrollArea, ScrollBar } from "@/src/lib/components/ui/scroll-area"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"
import { invoke } from "src/app/blitz-server"
import getSetting from "@/src/lib/model/settings/queries/getSetting"
import Theme from "@/src/app/(internal)/theme"
import getCurrentUser from "@/src/lib/model/auth/queries/getCurrentUser"
import checkOnboardingStatus from "@/src/lib/model/onboarding/queries/checkOnboardingStatus"
import { redirect } from "next/navigation"
import { Suspense } from "react"

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

    return (
        <div className={"bg-neutral-100 dark:bg-neutral-900"} dir={"ltr"}>
            <Suspense>
                <Theme theme={settings.theme} />
                <SidebarProvider>
                    <HouseholdProvider>
                        <Sidebar />
                        <SidebarInset
                            className={"flex p-4 box-border bg-neutral-100 dark:bg-neutral-900 h-screen max-h-screen"}>
                            <main
                                className={"flex-1 p-4 w-full bg-background rounded-xl h-full"}>
                                <ScrollArea
                                    className={"h-full overflow-y-auto rounded-xl px-4 py-2 flex flex-col justify-start"}>
                                    {children}
                                    <ScrollBar orientation="vertical" className={"pl-2"} />
                                </ScrollArea>
                            </main>
                        </SidebarInset>
                    </HouseholdProvider>
                </SidebarProvider>
            </Suspense>
        </div>
    )
}

RootLayout.authenticate = { redirectTo: "/login" }

export default RootLayout
