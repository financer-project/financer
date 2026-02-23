"use client"

import { Separator } from "@/src/lib/components/ui/separator"
import { Heading1, SubTitle } from "@/src/lib/components/common/typography"
import React, { PropsWithChildren, useState } from "react"
import { cn } from "@/src/lib/util/utils"
import { ChevronDown, ChevronRight } from "lucide-react"

export interface SectionProps extends PropsWithChildren {
    title: string,
    subtitle?: string,
    actions?: React.ReactNode | (() => React.ReactNode);
    className?: string;
    id?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    badge?: React.ReactNode;
}

const Section = ({ title, subtitle, actions, children, className, id, collapsible, defaultCollapsed, badge }: SectionProps) => {
    const sectionId = id ?? title.toLowerCase().replace(/\s+/g, "-")
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? false)

    const toggle = collapsible ? () => setIsCollapsed(prev => !prev) : undefined

    return (
        <section id={sectionId} className={cn("flex flex-col gap-6 mb-12", className)}>
            <Separator />
            <div className={"flex flex-row justify-between items-start"}>
                <div
                    className={cn("flex flex-row items-center gap-3", collapsible && "cursor-pointer select-none")}
                    onClick={toggle}
                >
                    {collapsible && (
                        isCollapsed
                            ? <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Heading1>{title}</Heading1>
                            {badge}
                        </div>
                        {subtitle && (<SubTitle>{subtitle}</SubTitle>)}
                    </div>
                </div>
                {actions && (typeof actions === "function" ? actions() : actions)}
            </div>
            {!isCollapsed && (
                <div className={"flex flex-col gap-4"}>
                    {children}
                </div>
            )}
        </section>
    )
}
export default Section
