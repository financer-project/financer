import { invoke } from "./blitz-server"
import getCurrentUser from "@/src/lib/model/auth/queries/getCurrentUser"
import checkOnboardingStatus from "@/src/lib/model/onboarding/queries/checkOnboardingStatus"
import { redirect } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { LogInIcon, SquarePenIcon } from "lucide-react"
import Logo from "@/src/lib/components/content/Logo"
import { Separator } from "@/src/lib/components/ui/separator"

export default async function Home() {
    const currentUser = await invoke(getCurrentUser, null)
    if (currentUser) {
        redirect("/dashboard")
    } else {
        // Check if onboarding is needed (no users exist)
        const onboardingStatus = await invoke(checkOnboardingStatus, {})
        if (onboardingStatus.needsOnboarding) {
            redirect("/onboarding")
        }
        return (
            <main className={"flex flex-col h-screen items-center justify-center mx-auto"}>
                <Logo />
                <div className={"flex gap-4"}>
                    <Button asChild
                            variant={"default"}
                            className={"w-24"}>
                        <Link href={"/login"}>
                            <LogInIcon />
                            Login
                        </Link>
                    </Button>
                    <Separator orientation={"vertical"} />
                    <Button asChild
                            variant={"outline"}
                            className={"w-24"}>
                        <Link href={"/signup"}>
                            <SquarePenIcon />
                            Sign Up
                        </Link>
                    </Button>
                </div>
            </main>
        )
    }
}
