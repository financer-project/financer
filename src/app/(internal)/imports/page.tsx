import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import Header from "@/src/lib/components/content/nav/Header"
import { Button } from "@/src/lib/components/ui/button"
import { ImportJobsList } from "./components/ImportJobsList"

export const metadata: Metadata = {
    title: "Import Transactions",
    description: "Import transactions from CSV files"
}

export default function Page() {
    return (
        <div>
            <Header title={"Import Transactions"}
                    subtitle={"Import your transactions from CSV files."}
                    breadcrumbs={[{ label: "Imports" }]}
                    actions={
                        <div>
                            <Button variant={"default"}
                                    asChild>
                                <Link href={"/imports/new"}>New Import</Link>
                            </Button>
                        </div>
                    } />
            <Suspense fallback={<div>Loading...</div>}>
                <ImportJobsList />
            </Suspense>
        </div>
    )
}
