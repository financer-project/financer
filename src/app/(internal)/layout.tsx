import { Metadata } from "next"
import { SidebarInset, SidebarProvider } from "@/src/lib/components/ui/sidebar"
import { BlitzLayout } from "@blitzjs/next"
import Sidebar from "@/src/lib/components/content/nav/sidebar/sidebar"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { useAuthenticatedBlitzContext } from "@/src/app/blitz-server"

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
                <Sidebar />
                <SidebarInset className={"flex p-4 box-border bg-gray-100 max-h-screen"}>
                    <ScrollArea className={"h-full"} type={"auto"}>
                        <main
                            className={"flex-1 flex flex-col mx-auto px-8 py-6 w-full bg-background rounded-xl"}>
                            {children}
                        </main>
                    </ScrollArea>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}

export default RootLayout
