import { Skeleton } from "@/src/lib/components/ui/skeleton"
import { Separator } from "@/src/lib/components/ui/separator"

export default function Loading() {
    return (
        <div className={"flex bg-sidebar w-screen h-screen"}>
            <div className={"md:flex hidden flex-col w-64 p-4"}>
                <div className={"pb-2"}>
                    <Skeleton className={"h-10 w-full bg-border"} />
                </div>
                <Separator className={"mt-1"} />
                <div className={"flex flex-col grow gap-2 mt-6"}>
                    <div className={"flex flex-col gap-2 "}>
                        <Skeleton className={"h-4 w-32 bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                    </div>

                    <div className={"flex flex-col gap-2 mt-6"}>
                        <Skeleton className={"h-4 w-32 bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                    </div>

                    <div className={"flex flex-col gap-2 mt-6"}>
                        <Skeleton className={"h-4 w-32 bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                        <Skeleton className={"h-6 w-full bg-border"} />
                    </div>
                </div>

                <div className={"place-self-end"}>
                    <Separator className={"mb-2"} />
                    <div className={"flex gap-2"}>
                        <Skeleton className={"h-10 w-10 bg-border"} />
                        <Skeleton className={"h-10 w-full bg-border"} />
                    </div>
                </div>
            </div>
            <div className={"grow h-screen md:py-4 md:pr-4"}>
                <div className={"flex flex-col bg-background rounded-xl h-full w-full"}>
                    <div className={"flex gap-4 px-4 py-4 items-center rounded-xl"}>
                        <Skeleton className={"h-4 w-4"} />
                        <Separator orientation={"vertical"} />
                        <Skeleton className={"h-4 w-4"} />
                        <Separator orientation={"vertical"} />
                        <Skeleton className={"h-4 w-64"} />
                    </div>
                    <Separator className={"mt-1"} />
                    <div className={"mt-2 px-4 py-3"}>
                        <Skeleton className={"h-8 w-4/5"} />
                        <Skeleton className={"h-4 w-3/5 mt-2"} />
                    </div>

                    <div className={"grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-4 px-4 py-4"}>
                        <Skeleton className={"h-24 w-full"} />
                        <Skeleton className={"h-24 w-full"} />
                        <Skeleton className={"h-24 w-full"} />
                        <Skeleton className={"h-24 w-full"} />
                    </div>

                    <div className={"flex flex-col gap-4 px-4 py-4"}>
                        <Skeleton className={"h-64 w-full"} />
                        <Skeleton className={"h-64 w-full"} />
                        <Skeleton className={"h-64 w-full"} />
                    </div>
                </div>
            </div>
        </div>
    )
}
