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
        <div>
            <Theme theme={settings.theme} />
            <HouseholdProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <main className={"flex flex-col w-full h-screen bg-sidebar md:p-4 p-0"}>
                        <div className={"bg-background md:rounded-xl h-full max-h-full"}>
                            <ScrollArea
                                className={"h-full overflow-y-auto md:rounded-xl flex flex-col justify-start"}>
                                {children}
                                <ScrollBar orientation="vertical" className={"pl-2"} />
                            </ScrollArea>
                        </div>
                    </main>
                </SidebarProvider>
            </HouseholdProvider>
        </div>
    )
}

RootLayout.authenticate = { redirectTo: "/login" }

export default RootLayout
