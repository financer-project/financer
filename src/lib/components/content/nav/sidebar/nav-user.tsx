"use client"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/src/lib/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/src/lib/components/ui/dropdown-menu"
import { BookText, ChevronsUpDown, DollarSign, ExternalLink, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@blitzjs/rpc"
import logout from "@/src/lib/model/auth/mutations/logout"
import { useCurrentUser } from "@/src/lib/hooks/useCurrentUser"
import { useIsMobile } from "@/src/lib/hooks/use-mobile"
import { UserAvatar } from "@/src/lib/components/content/user"

export function NavUser() {
    const user = useCurrentUser()
    const isMobile = useIsMobile()

    const router = useRouter()
    const [logoutMutation] = useMutation(logout)

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <UserAvatar showName={true} showEmail={true} user={user} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}>
                        <DropdownMenuLabel>
                            <UserAvatar showName={true} showEmail={true} user={user} />
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href={"https://financer-project.org/"}>
                                    <DollarSign />
                                    <span className={"grow"}>Financer</span>
                                    <ExternalLink />
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={"https://docs.financer-project.org/"}>
                                    <BookText />
                                    <span className={"grow"}>Docs</span>
                                    <ExternalLink />
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                href={"#"}
                                onClick={async () => {
                                    await logoutMutation()
                                    router.refresh()
                                }}>
                                <LogOut />
                                Log out
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
