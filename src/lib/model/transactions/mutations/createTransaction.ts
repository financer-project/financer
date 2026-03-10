import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateTransactionSchema } from "../schemas"
import { TransactionType } from "@prisma/client"
import Guard from "@/src/lib/guard/ability"
import { Ctx, NotFoundError } from "blitz"
import { readTempFile, moveTempToAttachment } from "@/src/lib/util/fileStorage"

export default resolver.pipe(
    resolver.zod(CreateTransactionSchema),
    resolver.authorize(),
    async (input, ctx: Ctx) => {
        const account = await db.account.findFirst({ where: { id: input.accountId } })
        if (!account) throw new NotFoundError(`Account with ID ${input.accountId} does not exist`)
        return { householdId: account.householdId, createdById: ctx.session.userId, ...input }
    },
    Guard.authorizePipe("create", "Transaction"),
    async (transaction) => {
        const { tagIds, householdId, tempFileId, tempFileName, ...transactionData } = transaction // eslint-disable-line @typescript-eslint/no-unused-vars

        // Adjust amount based on transaction type
        transactionData.amount = transactionData.type === TransactionType.EXPENSE ?
            -Math.abs(transactionData.amount) : Math.abs(transactionData.amount)

        // Create transaction with tag connections if tagIds are provided
        let createdTransaction
        if (tagIds && tagIds.length > 0) {
            createdTransaction = await db.transaction.create({
                data: {
                    ...transactionData,
                    tags: {
                        create: tagIds.map(tagId => ({
                            tag: {
                                connect: { id: tagId }
                            }
                        }))
                    }
                },
                include: {
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            })
        } else {
            createdTransaction = await db.transaction.create({
                data: { ...transactionData }
            })
        }

        // If a temp file was uploaded, promote it to a permanent attachment
        if (tempFileId) {
            try {
                const { metadata } = readTempFile(tempFileId)
                const attachment = await db.attachment.create({
                    data: {
                        name: metadata.originalName,
                        size: metadata.size,
                        type: metadata.mimeType,
                        path: "",
                        transactionId: createdTransaction.id
                    }
                })
                const finalPath = await moveTempToAttachment(tempFileId, createdTransaction.id, attachment.id)
                await db.attachment.update({ where: { id: attachment.id }, data: { path: finalPath } })
            } catch (err) {
                console.error("[createTransaction] Failed to attach invoice file:", err)
                // Non-fatal: transaction is already created
            }
        }

        return createdTransaction
    }
)
