import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/src/lib/components/ui/breadcrumb"
import { HomeIcon } from "lucide-react"
import { Separator } from "@/src/lib/components/ui/separator"
import { Title } from "@/src/lib/components/common/typography"

interface HeaderProps {
    title: string,
    breadcrumbs: [
        {
            label: string,
            url?: string
        }
    ]
}

const Header = ({ title, breadcrumbs }: HeaderProps) => {
    return (
        <div className={"flex flex-col gap-4 mb-8"}>
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
                                            <BreadcrumbLink href={item.url}>
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
            <Title>{title}</Title>
        </div>
    )
}

export default Header