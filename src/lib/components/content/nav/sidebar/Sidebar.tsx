"use client"

import {
    Sidebar as SidebarComponent,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/src/lib/components/ui/sidebar"
import { Separator } from "@/src/lib/components/ui/separator"
import { NavUser } from "@/src/lib/components/content/nav/sidebar/nav-user"
import { ArrowLeftRightIcon, BookmarkIcon, ChartLineIcon, HandCoinsIcon, HouseIcon, WalletIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import NavHousehold from "@/src/lib/components/content/nav/sidebar/NavHousehold"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"

const groups = [
    {
        name: "Transactions",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: ChartLineIcon
            },
            {
                title: "Transactions",
                url: "",
                icon: ArrowLeftRightIcon
            }
        ]
    },
    {
        name: "Budgets",
        items: [
            {
                title: "Budgets",
                url: "",
                icon: HandCoinsIcon
            },
            {
                title: "Categories",
                url: "",
                icon: BookmarkIcon
            }
        ]
    },
    {
        name: "Settings",
        items: [
            {
                title: "Households",
                url: "/households",
                icon: HouseIcon
            },
            {
                title: "Accounts",
                url: "",
                icon: WalletIcon
            }
        ]
    }
]

const Sidebar = () => {
    const pathname = usePathname()

    return (
        <SidebarComponent
            variant={"inset"}
            collapsible="none"
            side={"left"}
            className={"h-screen "}>
            <SidebarHeader className={"flex flex-col justify-center items-center py-4 h-20 max-h-20"}>
                <NavHousehold />
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                {groups.map((group) => (
                    <SidebarGroup key={group.name}>
                        <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild
                                                       isActive={pathname.includes(item.url)}>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <Separator />
                <NavUser />
            </SidebarFooter>
        </SidebarComponent>
    )
}

export default Sidebar
