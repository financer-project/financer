import { SignupForm } from "../components/SignupForm"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/src/lib/components/ui/button"

export default function SignUpPage() {
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
                <SignupForm />
            </div>
        </main>
    )
}
