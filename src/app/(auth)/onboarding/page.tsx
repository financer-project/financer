import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { NewHouseholdForm } from "@/src/app/(internal)/households/components/NewHousehold"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"

const OnboardingPage = () => (
    <main>
        <div className={"flex flex-col w-lg h-screen justify-center items-start mx-auto gap-4"}>
            <Button variant={"ghost"}
                    asChild>
                <Link href={"/"}>
                    <ArrowLeftIcon />
                    Back
                </Link>
            </Button>
            <Card className={"w-full"}>
                <CardHeader>
                    <CardTitle>Create a new household</CardTitle>
                    <CardDescription>First create a new household in order to start.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NewHouseholdForm />
                </CardContent>
            </Card>
        </div>
    </main>
)

export default OnboardingPage