import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import Guard from "@/src/lib/guard/ability"

const AddAttachmentSchema = z.object({
    id: z.string().uuid(),
    transactionId: z.string().uuid(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
    path: z.string(),
})

export default resolver.pipe(
    resolver.zod(AddAttachmentSchema),
    resolver.authorize(),
    async (input, ctx) => {
        await Guard.authorize("update", "Transaction", { id: input.transactionId }, ctx)
        return input
    },
    async (input) => {
        const attachment = await db.attachment.create({
            data: {
                id: input.id,
                name: input.name,
                size: input.size,
                type: input.type,
                path: input.path,
                transaction: {
                    connect: {
                        id: input.transactionId
                    }
                }
            }
        })

        return attachment
    }
)
