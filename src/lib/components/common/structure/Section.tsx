import { Separator } from "@/src/lib/components/ui/separator"
import { Heading1, SubHeading } from "@/src/lib/components/common/typography"
import React, { PropsWithChildren } from "react"

export interface SectionProps extends PropsWithChildren {
    title: string,
    subtitle?: string,
    actions?: React.ReactNode | (() => React.ReactNode);

}

const Section = ({ title, subtitle, actions, children }: SectionProps) => {
    return (
        <section className={"flex flex-col gap-6 mt-6"}>
            <Separator />
            <div className={"flex flex-row justify-between"}>
                <div>
                    <Heading1>{title}</Heading1>
                    {subtitle && (<SubHeading>{subtitle}</SubHeading>)}
                </div>
                {actions && (typeof actions === "function" ? actions() : actions)}
            </div>
            {children}
        </section>
    )
}
export default Section