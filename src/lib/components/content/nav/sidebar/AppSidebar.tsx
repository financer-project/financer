"use client"

import {
    Sidebar,
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
import {
    ArrowLeftRightIcon,
    BookmarkIcon,
    ChartLineIcon,
    CirclePlus,
    CogIcon,
    HouseIcon,
    ImportIcon,
    ShieldIcon,
    StoreIcon,
    TagIcon
} from "lucide-react"
import { usePathname } from "next/navigation"
import NavHousehold from "@/src/lib/components/content/nav/sidebar/NavHousehold"
import { useSession } from "@blitzjs/auth"
import { Role } from "@prisma/client"

interface MenuGroup {
    name: string
    items: MenuItem[]
}

interface MenuItem {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
    variant?: "default" | "primary" | "outline"
}

const getGroups = (isAdmin: boolean): MenuGroup[] => [
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
                url: "/transactions",
                icon: ArrowLeftRightIcon
            },
            {
                title: "Imports",
                url: "/imports",
                icon: ImportIcon
            },
            {
                title: "Create Transaction",
                url: "/transactions/new",
                icon: CirclePlus,
                variant: "primary"
            }
        ]
    },
    {
        name: "Organization",
        items: [
            // {
            //     title: "Budgets",
            //     url: "/budgets",
            //     icon: HandCoinsIcon
            // },
            {
                title: "Categories",
                url: "/categories",
                icon: BookmarkIcon
            },
            {
                title: "Tags",
                url: "/tags",
                icon: TagIcon
            },
            {
                title: "Counterparties",
                url: "/counterparties",
                icon: StoreIcon
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
                title: "Settings",
                url: "/settings",
                icon: CogIcon
            },
            ...(isAdmin ? [
                {
                    title: "Admin Settings",
                    url: "/settings/admin",
                    icon: ShieldIcon
                }
            ] : [])
        ]
    }
]

const AppSidebar = () => {
    const pathname = usePathname()
    const session = useSession()
    const isAdmin = session.role === Role.ADMIN

    return (
        <Sidebar>
            <SidebarHeader className={"flex flex-col justify-center items-center py-4 h-18 max-h-20 pl-4 md:pr-0 pr-4"}>
                <NavHousehold />
            </SidebarHeader>
            <SidebarContent className={"pl-4 md:pr-0 pr-4"}>
                <Separator />
                {getGroups(isAdmin).map((group) => (
                    <SidebarGroup key={group.name} className={"px-0"}>
                        <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild
                                                       isActive={pathname?.includes(item.url)}
                                                       variant={item.variant ?? "default"}>
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
            <SidebarFooter className={"pl-4 md:pr-0 pr-4"}>
                <Separator />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar
