import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import Guard from "@/src/lib/guard/ability"
import { deleteFile } from "@/src/lib/util/fileStorage"

import { AuthenticatedCtx } from "blitz"

const DeleteAttachmentSchema = z.object({
    id: z.uuid(),
})

export default resolver.pipe(
    resolver.zod(DeleteAttachmentSchema),
    resolver.authorize(),
    async (input, ctx: AuthenticatedCtx) => {
        const attachment = await db.attachment.findUnique({
            where: { id: input.id },
            include: { transaction: true }
        })

        if (!attachment) {
            throw new Error("Attachment not found")
        }

        await Guard.authorizePipe("update", "Transaction")({ id: attachment.transactionId }, ctx)

        await db.attachment.delete({
            where: { id: input.id }
        })

        // Delete the file from disk
        deleteFile(attachment.path)

        return attachment
    }
)
