"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/src/lib/components/ui/breadcrumb"
import { ArrowLeftIcon, HomeIcon } from "lucide-react"
import { Separator } from "@/src/lib/components/ui/separator"
import { SubTitle, Title } from "@/src/lib/components/common/typography"
import React from "react"
import Link from "next/link"
import { Button } from "@/src/lib/components/ui/button"
import { SidebarTrigger } from "@/src/lib/components/ui/sidebar"
import { useIsMobile } from "@/src/lib/hooks/use-mobile"

interface BreadcrumbItem {
    label: string,
    url?: string
}

interface HeaderProps {
    title: string,
    subtitle?: string
    breadcrumbs: BreadcrumbItem[],
    actions?: React.ReactNode | (() => React.ReactNode);
    hideBackButton?: boolean
}

const Header = ({ title, subtitle, breadcrumbs, actions, hideBackButton }: HeaderProps) => {
    const isMobile = useIsMobile()

    return (
        <div className={"flex flex-col gap-4 mb-12"}>
            <div className={"flex flex-col h-10 justify-between"}>
                <div className={"flex flex-row gap-4"}>
                    <SidebarTrigger />
                    <Separator orientation={"vertical"} />

                    {!isMobile && !hideBackButton && (
                        <>
                            <Button variant={"link"} asChild className={"text-default p-0 h-full"}>
                                <Link
                                    href={{
                                        pathname: breadcrumbs.length - 2 >= 0
                                            ? breadcrumbs[breadcrumbs.length - 2].url ?? "/dashboard"
                                            : "/dashboard"
                                    }}>
                                    <ArrowLeftIcon />
                                    Back
                                </Link>
                            </Button>
                            <Separator orientation={"vertical"} />
                        </>
                    )}

                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem key={"/dashboard"}>
                                <BreadcrumbLink href={"/dashboard"}>
                                    <HomeIcon className={"w-4"} />
                                    Home
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((item, index) => (
                                <>
                                    <BreadcrumbSeparator key={`${item.url}-separator`} />
                                    <BreadcrumbItem key={item.url}>
                                        {index === breadcrumbs.length - 1
                                            ? <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                            : <BreadcrumbLink href={item.url ?? "#"}>
                                                {item.label}
                                            </BreadcrumbLink>

                                        }
                                    </BreadcrumbItem>
                                </>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <Separator />
            </div>
            <div className={"flex justify-between items-center"}>
                <div className={"grow"}>
                    <Title className={"flex flex-row gap-4 items-center"}>
                        {title}
                    </Title>
                    <SubTitle>{subtitle}</SubTitle>
                </div>
                {actions && (typeof actions === "function" ? actions() : actions)}
            </div>
        </div>
    )
}

export default Header