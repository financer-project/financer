import { Metadata } from "next"
import { SidebarInset, SidebarProvider } from "@/src/lib/components/ui/sidebar"
import { BlitzLayout } from "@blitzjs/next"
import Sidebar from "@/src/lib/components/content/nav/sidebar/Sidebar"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"
import { invoke } from "src/app/blitz-server"
import getSetting from "@/src/lib/model/settings/queries/getSetting"
import Theme from "@/src/app/(internal)/theme"
import getCurrentUser from "@/src/app/users/queries/getCurrentUser"
import { redirect } from "next/navigation"

async function fetchUser() {
    return invoke(getCurrentUser, {})
}

async function fetchSettings() {
    return invoke(getSetting, {})
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

    const settings = await fetchSettings()

    return (
        <div className={"bg-neutral-100 dark:bg-neutral-900"}>
            <Theme theme={settings.theme} />
            <SidebarProvider>
                <HouseholdProvider>
                    <Sidebar />
                    <SidebarInset
                        className={"flex p-4 box-border bg-neutral-100 dark:bg-neutral-900 h-screen max-h-screen"}>
                        <ScrollArea className={"h-full"} type={"auto"}>
                            <main
                                className={"flex-1 flex flex-col justify-start px-8 py-6 w-full bg-background rounded-xl h-full"}>
                                {children}
                            </main>
                        </ScrollArea>
                    </SidebarInset>
                </HouseholdProvider>
            </SidebarProvider>
        </div>
    )
}

export default RootLayout
