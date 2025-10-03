"use client"

import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { PageActions, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import deleteCategory from "@/src/lib/model/categories/mutations/deleteCategory"
import { Category } from "@prisma/client"
import { CirclePlus } from "lucide-react"

const CategoryHeader = ({ category }: { category: Category }) => {
    const [deleteCategoryMutation] = useMutation(deleteCategory)
    const router = useRouter()

    const renderActions = (category: Category) => (
        <div className={"flex flex-row gap-2"}>
            <Button variant={"outline"} asChild>
                <Link href={`/categories/new?parentId=${category.id}&type=${category.type}&color=${category.color}`}>
                    <CirclePlus />Add Child
                </Link>
            </Button>
            <Button variant={"outline"} asChild>
                <Link href={`/categories/${category.id}/edit`}>Edit</Link>
            </Button>
            <Button
                variant={"destructive"}
                onClick={async () => {
                    const confirmed = await ConfirmationDialog({
                        title: "Do you really want to delete this category?",
                        description: "Deleting a category is irreversible and will delete all associated transactions."
                    })

                    if (confirmed) {
                        await deleteCategoryMutation({ id: category.id })
                        router.push("/categories")
                    }
                }}>
                Delete
            </Button>
        </div>
    )

    return (
        <PageHeader items={[
            { label: "Categories", url: "/categories" },
            { label: category.name }
        ]}>
            <PageTitle>Categories</PageTitle>
            <PageDescription>Here you can see all details of your category.</PageDescription>
            <PageActions>{renderActions(category)}</PageActions>
        </PageHeader>
    )
}
export default CategoryHeader