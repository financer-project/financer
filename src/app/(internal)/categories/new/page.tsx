import { Metadata } from "next"
import { Suspense } from "react"
import { NewCategory } from "@/src/app/(internal)/categories/components/NewCategory"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { invoke } from "@/src/app/blitz-server"
import authorizeAbility from "@/src/lib/guard/queries/authorizeAbility"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "New Category",
    description: "Create a new category"
}

export default async function NewCategoryPage() {
    const allowed = await invoke(authorizeAbility, {
        action: "create",
        resource: Prisma.ModelName.Category,
        useCurrentHousehold: true
    })
    if (!allowed) {
        redirect("/categories")
    }
    return (
        <Page>
            <PageHeader items={[
                { label: "Categories", url: "/categories" },
                { label: "New" }
            ]}>
                <PageTitle>Create new Category</PageTitle>
                <PageDescription>Here can you create a new category</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <CategoryProvider>
                        <NewCategory />
                    </CategoryProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
