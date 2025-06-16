import { Separator } from "@/src/lib/components/ui/separator"
import { Heading1, SubTitle } from "@/src/lib/components/common/typography"
import React, { PropsWithChildren } from "react"
import { cn } from "@/src/lib/util/utils"

export interface SectionProps extends PropsWithChildren {
    title: string,
    subtitle?: string,
    actions?: React.ReactNode | (() => React.ReactNode);
    className?: string;
    id?: string;
}

const Section = ({ title, subtitle, actions, children, className, id }: SectionProps) => {
    const sectionId = id ?? title.toLowerCase().replace(/\s+/g, "-")

    return (
        <section id={sectionId} className={cn("flex flex-col gap-8 mb-6", className)}>
            <Separator />
            <div className={"flex flex-row justify-between"}>
                <div>
                    <Heading1>{title}</Heading1>
                    {subtitle && (<SubTitle>{subtitle}</SubTitle>)}
                </div>
                {actions && (typeof actions === "function" ? actions() : actions)}
            </div>
            {children}
        </section>
    )
}
export default Section
