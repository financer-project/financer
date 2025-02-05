"use client"

import { useCurrentUser } from "@/src/app/users/hooks/useCurrentUser"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
import { useMutation } from "@blitzjs/rpc"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/src/lib/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/src/lib/components/ui/dropdown-menu"
import { ChevronsUpDown, HouseIcon, Sparkles } from "lucide-react"
import { useCurrentHousehold, useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"
import changeCurrentHousehold from "@/src/lib/model/household/mutations/changeCurrentHousehold"
import { cn } from "@/lib/utils"
import { Formatters } from "@/src/lib/util/Formatter"
import { useState } from "react"
import { Household } from "@prisma/client"

const NavHousehold = () => {
    const [currentHousehold, setCurrentHousehold] = useState<Household | null>(useCurrentHousehold())
    const isMobile = useIsMobile()
    const [changeCurrentHouseholdMutation] = useMutation(changeCurrentHousehold)

    const router = useRouter()

    const isActive = (id: string) => {
        return currentHousehold?.id === id
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <div
                                className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
                                <HouseIcon className={"w-4"} />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{currentHousehold?.name ?? "No Household selected"}</span>
                                <span className="truncate text-xs">
                                    {Formatters.currencyDescription.format(currentHousehold?.currency ?? "Please create one first")}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}>

                        <DropdownMenuGroup className={"flex flex-col gap-1"}>
                            {useHouseholds().map(household => (
                                <DropdownMenuItem
                                    key={household.id}
                                    className={cn("gap-4", isActive(household.id) ? "bg-accent" : "")}
                                    onSelect={async () => {
                                        try {
                                            const changedHousehold = await changeCurrentHouseholdMutation({ id: household.id })
                                            setCurrentHousehold(changedHousehold)
                                            router.refresh()
                                        } catch (error) {
                                            console.error("Failed to change household:", error)
                                        }
                                    }}>
                                    <Sparkles className={isActive(household.id) ? "" : "invisible"} />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{household.name}</span>
                                        <span className="text-muted-foreground">{household.description}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>

                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default NavHousehold