import { ResetPasswordForm } from "@/src/app/(auth)/components/ResetPasswordForm"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

export default function ResetPasswordPage() {
    return (
        <main>
            <div className={"flex flex-col w-lg h-screen justify-center items-start mx-auto gap-4"}>
                <Button variant={"ghost"}
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
