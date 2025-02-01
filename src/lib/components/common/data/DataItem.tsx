import { Label } from "../../ui/label"
import { cn } from "@/lib/utils"

interface DataItemProps {
    className?: string,
    label: string,
    data: string | number | null
}

const DataItem = ({ label, data, className }: DataItemProps) => {
    return (
        <div className={cn("flex flex-col", className)}>
            <Label className={"text-sm text-muted-foreground"}>{label}</Label>
            <p className={"text-md"}>{data ?? "-"}</p>
        </div>
    )

}

export default DataItem