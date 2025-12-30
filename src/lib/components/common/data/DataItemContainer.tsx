import { PropsWithChildren } from "react"

export const DataItemContainer = ({ children }: PropsWithChildren & { className?: string }) => (
    <div className={"grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 w-full gap-4"}>
        {children}
    </div>
)

export const DataItemWrapper = ({ children }: PropsWithChildren) => (
    <div className={"flex flex-col md:gap-4 gap-6"}>
        {children}
    </div>
)