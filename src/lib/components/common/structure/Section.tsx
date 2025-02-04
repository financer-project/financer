import { Separator } from "@/src/lib/components/ui/separator"
import { Heading1, SubHeading } from "@/src/lib/components/common/typography"
import { PropsWithChildren } from "react"

export interface SectionProps extends PropsWithChildren {
    title: string,
    subtitle?: string
}

const Section = ({ title, subtitle, children }: SectionProps) => {
    return (
        <section className={"flex flex-col gap-6"}>
            <Separator />
            <div>
                <Heading1>{title}</Heading1>
                {subtitle && (<SubHeading>{subtitle}</SubHeading>)}
            </div>
            {children}
        </section>
    )
}
export default Section