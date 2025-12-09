import { PropsWithChildren } from "react"

export const DataItemContainer = ({ children }: PropsWithChildren) => (
    <div className={"grid lg:grid-cols-4 grid-cols-3 w-full gap-4"}>
        {children}
    </div>
)

export const DataItemGroup = ({ children }: PropsWithChildren) => (
    <div className={"col-span-4 row-span-full"}>
        <DataItemContainer>
            {children}
        </DataItemContainer>
    </div>
)