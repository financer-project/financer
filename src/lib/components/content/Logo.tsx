import Image from "next/image"

const Logo = () => (
    <div className={"flex flex-col gap-4 items-center justify-center mb-8"}>
        <Image src={"/financer-icon-full.png"}
               alt={"Logo"}
               width={100} height={100} />
        <div className={"flex flex-col items-center"}>
            <span className={"font-bold font-mono"}>FINANCER.</span>
            <span className={"text-sm text-muted-foreground"}>Your self-hosted personal finance tracking app.</span>
        </div>
    </div>
)

export default Logo