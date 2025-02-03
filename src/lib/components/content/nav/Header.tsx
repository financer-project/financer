import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/src/lib/components/ui/breadcrumb"
import { HomeIcon } from "lucide-react"
import { Separator } from "@/src/lib/components/ui/separator"
import { SubTitle, Title } from "@/src/lib/components/common/typography"
import React from "react"

interface BreadcumbItem {
    label: string,
    url?: string
}

interface HeaderProps {
    title: string,
    subtitle?: string
    breadcrumbs: BreadcumbItem[],
    actions?: React.ReactNode | (() => React.ReactNode);
}

const Header = ({ title, subtitle, breadcrumbs, actions }: HeaderProps) => {
    return (
        <div className={"flex flex-col gap-4 mb-16"}>
            <div className={"flex flex-col h-10 justify-between"}>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={"/dashboard"}>
                                <HomeIcon className={"w-4"} />
                                Home
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {breadcrumbs.map((item, index) => (
                            <>
                                <BreadcrumbSeparator />
                                {index === breadcrumbs.length - 1 ?
                                    (
                                        <BreadcrumbPage>
                                            {item.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href={item.url ?? "#"}>
                                                {item.label}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    )}
                            </>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <Separator />
            </div>
            <div className={"flex justify-between items-center"}>
                <div>
                    <Title>{title}</Title>
                    <SubTitle>{subtitle}</SubTitle>
                </div>
                {actions && (typeof actions === "function" ? actions() : actions)}
            </div>
        </div>
    )
}

export default Header