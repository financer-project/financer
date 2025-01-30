import { Metadata } from "next"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { BlitzLayout } from "@blitzjs/next"
import Sidebar from "@/src/lib/components/content/sidebar/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthenticatedBlitzContext } from "@/src/app/blitz-server"

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s – Financer",
  },
  description: "Dashboard",
}

const RootLayout: BlitzLayout = async ({ children }: { children: React.ReactNode }) => {
  await useAuthenticatedBlitzContext({
    redirectTo: "/login",
  })

  return (
    <div>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className={"overflow-hidden"}>
          <main className={"flex-1 flex flex-col mx-auto p-6 w-full"}>
            <ScrollArea>{children}</ScrollArea>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default RootLayout
