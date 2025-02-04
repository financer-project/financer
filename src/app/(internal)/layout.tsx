import { Metadata } from "next"
import { SidebarInset, SidebarProvider } from "@/src/lib/components/ui/sidebar"
import { BlitzLayout } from "@blitzjs/next"
import Sidebar from "@/src/lib/components/content/nav/sidebar/Sidebar"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { useAuthenticatedBlitzContext } from "@/src/app/blitz-server"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"

export const metadata: Metadata = {
    title: {
        default: "Dashboard",
        template: "%s – Financer"
    },
    description: "Dashboard"
}

const RootLayout: BlitzLayout = async ({ children }: { children: React.ReactNode }) => {
    await useAuthenticatedBlitzContext({
        redirectTo: "/login"
    })

    return (
        <div className={"bg-gray-100"}>
            <SidebarProvider>
                <HouseholdProvider>
                    <Sidebar />
                    <SidebarInset className={"flex p-4 box-border bg-gray-100 h-screen max-h-screen"}>
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
