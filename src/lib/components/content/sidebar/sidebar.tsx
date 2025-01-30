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
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { NavUser } from "@/src/lib/components/content/sidebar/nav-user"
import {
  ArrowLeftRightIcon,
  BookmarkIcon,
  ChartLineIcon,
  HandCoinsIcon,
  HouseIcon,
  WalletIcon,
} from "lucide-react"

const groups = [
  {
    name: "Transactions",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: ChartLineIcon,
      },
      {
        title: "Transactions",
        url: "",
        icon: ArrowLeftRightIcon,
      },
    ],
  },
  {
    name: "Budgets",
    items: [
      {
        title: "Budgets",
        url: "",
        icon: HandCoinsIcon,
      },
      {
        title: "Categories",
        url: "",
        icon: BookmarkIcon,
      },
    ],
  },
  {
    name: "Settings",
    items: [
      {
        title: "Households",
        url: "",
        icon: HouseIcon,
      },
      {
        title: "Accounts",
        url: "",
        icon: WalletIcon,
      },
    ],
  },
]

const Sidebar = () => {
  return (
    <SidebarComponent
      variant={"inset"}
      collapsible="none"
      side={"left"}
      className={"h-screen border-r-1"}
    >
      <SidebarHeader className={"text-center py-4"}>
        <h1>F I N A N C E R</h1>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.name}>
            <Separator className={"mb-4"} />
            <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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
