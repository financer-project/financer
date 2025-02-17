import { Label } from "../../ui/label"
import { cn } from "@/lib/utils"
import Link from "next/link"

type Data = string | number | React.ReactNode | null | undefined;

interface DataItemProps {
    className?: string,
    label: string,
    data: Data
    linkTo?: string
}

const DataItem = ({ label, data, className, linkTo }: DataItemProps) => {
    const renderData = (data: Data) => (
        <p className={"text-md"}>{data ?? "-"}</p>
    )

    return (
        <div className={cn("flex flex-col", className)}>
            <Label className={"text-sm text-muted-foreground"}>{label}</Label>
            {linkTo && data
                ? <Link href={{ pathname: linkTo }}
                        className={"underline underline-offset-5 font-medium"}>
                    {renderData(data)}
                </Link>
                : renderData(data)}
        </div>
    )

}

export default DataItem