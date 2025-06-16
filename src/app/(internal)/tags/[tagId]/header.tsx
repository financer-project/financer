"use client"

import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import Header from "@/src/lib/components/content/nav/Header"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import deleteTag from "@/src/lib/model/tags/mutations/deleteTag"
import { Tag } from "@prisma/client"

const TagHeader = ({ tag }: { tag: Tag }) => {
    const [deleteTagMutation] = useMutation(deleteTag)
    const router = useRouter()

    const renderActions = (tag: Tag) => (
        <div className={"flex flex-row gap-4"}>
            <Button variant={"outline"} asChild>
                <Link href={`/tags/${tag.id}/edit`}>Edit</Link>
            </Button>
            <Button
                variant={"destructive"}
                onClick={async () => {
                    const confirmed = await ConfirmationDialog({
                        title: "Do you really want to delete this tag?",
                        description: "Deleting a tag is irreversible and will remove it from all associated transactions."
                    })

                    if (confirmed) {
                        await deleteTagMutation({ id: tag.id })
                        router.push("/tags")
                    }
                }}>
                Delete
            </Button>
        </div>
    )

    return (
        <Header title="Tags"
                subtitle={"Here you can see all details of your tag."}
                breadcrumbs={[
                    { label: "Tags", url: "/tags" },
                    { label: tag.name }
                ]}
                actions={renderActions(tag)} />
    )
}
export default TagHeader