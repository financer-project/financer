"use client"

import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/src/lib/components/ui/breadcrumb"
import { ArrowLeftIcon, HomeIcon } from "lucide-react"
import { Separator } from "@/src/lib/components/ui/separator"
import { SidebarTrigger } from "@/src/lib/components/ui/sidebar"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useIsMobile } from "@/src/lib/hooks/use-mobile"
import { SubTitle, Title } from "@/src/lib/components/common/typography"
import { cn } from "@/src/lib/util/utils"
import Image from "next/image"
import * as React from "react"
import { PropsWithChildren } from "react"


// Types and Interfaces
interface BreadcrumbItem {
    label: string,
    url?: string
}

interface PageHeaderProps extends PropsWithChildren, PageBreadcrumbsProps {
    hideBackButton?: boolean
    backUrl?: string
}

interface PageBreadcrumbsProps {
    items: BreadcrumbItem[]
}

interface PageTitleProps extends PropsWithChildren {
    className?: string
}

interface PageDescriptionProps extends PropsWithChildren {
    className?: string
}

interface PageContentProps extends PropsWithChildren {
    className?: string
}

export const Page = ({ children }: PropsWithChildren) => {
    return (
        <div className="flex flex-col gap-4">
            {children}
        </div>
    )
}

const PageBreadcrumbs = ({ items }: PageBreadcrumbsProps) => {
    const isMobile = useIsMobile()

    // On mobile, show max 2 items + ellipsis if there are more
    const maxMobileItems = 1
    const shouldTruncate = isMobile && items.length > maxMobileItems
    const visibleItems = shouldTruncate ? items.slice(-maxMobileItems) : items

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem key={"/dashboard"}>
                    <BreadcrumbLink href={"/dashboard"}>
                        <HomeIcon className={"w-4"} />
                        {!isMobile && "Home"}
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {shouldTruncate && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbEllipsis className="size-4" />
                        </BreadcrumbItem>
                    </>
                )}

                {visibleItems.map((item, index) => (
                    <React.Fragment key={item.url || item.label}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {index === visibleItems.length - 1
                                ? <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                : <BreadcrumbLink href={item.url ?? "#"}>
                                    {item.label}
                                </BreadcrumbLink>
                            }
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export const PageHeader = ({ children, hideBackButton, backUrl, items }: PageHeaderProps) => {
    const isMobile = useIsMobile()

    return (
        <div className={"flex flex-col gap-6 "}>
            <div className={"flex flex-col h-10"}>
                <div className={"flex flex-row gap-4 py-3 px-4 items-center"}>
                    <SidebarTrigger />
                    <Separator orientation={"vertical"} />

                    <div className={"flex flex-row gap-4 items-center"}>
                        <div className={"w-5 h-5 mx-1"}>
                            <Image src={"/financer-icon-full.png"} alt={"Logo"}
                                   width={100} height={100}
                                   objectFit={"contain"} />
                        </div>
                    </div>
                    <Separator orientation={"vertical"} />


                    {!isMobile && !hideBackButton && (
                        <>
                            <Button variant={"link"} asChild className={"text-default p-0 h-full"}>
                                <Link href={backUrl ?? "/dashboard"}>
                                    <ArrowLeftIcon />
                                    Back
                                </Link>
                            </Button>
                            <Separator orientation={"vertical"} />
                        </>
                    )}


                    <PageBreadcrumbs items={items} />
                </div>
                <Separator />
            </div>
            <PageContent>
                <div data-slot="page-header"
                     className={"@container/page-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=page-action]:grid-cols-[1fr_auto]"}>
                    {children}
                </div>
            </PageContent>
        </div>
    )
}

export const PageTitle = ({ children, className }: PageTitleProps) => {
    return (
        <Title className={`flex flex-row gap-4 items-center ${className || ""}`}>
            {children}
        </Title>
    )
}

export const PageDescription = ({ children, className }: PageDescriptionProps) => {
    return (
        <SubTitle className={className}>
            {children}
        </SubTitle>
    )
}

export const PageActions = ({ className, ...props }: React.ComponentProps<"div">) => {
    return (
        <div
            data-slot="page-action"
            className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end flex flex-row gap-2 items-center", className)}
            {...props} />
    )
}

export const PageContent = ({ children, className }: PageContentProps) => {
    return (
        <div className={cn("md:px-4 px-3", className)}>
            {children}
        </div>
    )
}