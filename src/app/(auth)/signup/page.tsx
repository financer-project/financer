import { SignupForm } from "@/src/app/(auth)/components/SignupForm"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/src/lib/components/ui/button"
import Logo from "@/src/lib/components/content/Logo"

export default function SignUpPage() {
    return (
        <main>
            <div className={"flex flex-col max-w-lg h-screen justify-center mx-auto gap-4"}>
                <Logo />
                <Button variant={"secondary"}
                        asChild>
                    <Link href={"/"}>
                        <ArrowLeftIcon />
                        Back
                    </Link>
                </Button>
                <SignupForm />
            </div>
        </main>
    )
}
