import { invoke } from "./blitz-server"
import getCurrentUser from "./users/queries/getCurrentUser"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { LogInIcon, SquarePenIcon } from "lucide-react"

export default async function Home() {
    const currentUser = await invoke(getCurrentUser, null)
    if (currentUser) {
        redirect("/dashboard")
    } else {
        return (
            <main className={"flex w-lg h-screen items-center justify-center mx-auto"}>
                <Card className={"w-md"}>
                    <CardHeader>
                        <CardTitle>Welcome to Financer!</CardTitle>
                        <CardDescription>Keep track of all your finances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={"flex flex-row gap-4"}>
                            <Button asChild
                                    variant={"default"}>
                                <Link href={"/login"}>
                                    <LogInIcon />
                                    Login
                                </Link>
                            </Button>
                            <Button asChild
                                    variant={"outline"}>
                                <Link href={"/signup"}>
                                    <SquarePenIcon />
                                    Sign Up
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        )
    }
}
