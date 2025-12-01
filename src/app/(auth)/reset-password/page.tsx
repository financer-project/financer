import { ResetPasswordForm } from "@/src/app/(auth)/components/ResetPasswordForm"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import Logo from "@/src/lib/components/content/Logo"

export default function ResetPasswordPage() {
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
                <ResetPasswordForm />
            </div>
        </main>
    )
}
