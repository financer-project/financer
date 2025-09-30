import { cn } from "@/src/lib/util/utils"
import ColorType, { getBackgroundColor } from "@/src/lib/model/common/ColorType"
import React from "react"

const ColoredTag = ({ color, label }: { color?: string | ColorType | null, label: string }) => {
    return (
        <div>
            <span className={"flex flex-row gap-2 items-center"}>
                {color
                    ? <span className={cn(`w-3 h-3 rounded-full block ${getBackgroundColor(color)}`)}></span>
                    : <span className={"w-3 h-3 border-2 rounded-full block"}></span>}
                {label}
            </span>
        </div>
    )
}

export default ColoredTag