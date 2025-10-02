import Link from "next/link"
import { LoginForm } from "@/src/app/(auth)/components/LoginForm"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/src/lib/components/ui/button"

export default function LoginPage() {
    return (
        <main>
            <div className={"flex flex-col max-w-lg h-screen justify-center items-start mx-auto gap-4"}>
                <Button variant={"ghost"}
                        asChild>
                    <Link href={"/"}>
                        <ArrowLeftIcon />
                        Back
                    </Link>
                </Button>
                <LoginForm />
            </div>
        </main>
    )
}
