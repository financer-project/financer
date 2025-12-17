import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateTransactionSchema } from "../schemas"
import { TransactionType } from "@prisma/client"
import Guard from "@/src/lib/guard/ability"
import { NotFoundError } from "blitz"

export default resolver.pipe(
    resolver.zod(CreateTransactionSchema),
    resolver.authorize(),
    async (input) => {
        const account = await db.account.findFirst({ where: { id: input.accountId } })
        if (!account) throw new NotFoundError(`Account with ID ${input.accountId} does not exist`)
        return { householdId: account.householdId, ...input }
    },
    Guard.authorizePipe("create", "Transaction"),
    async (transaction) => {
        const { tagIds, householdId, ...transactionData } = transaction // eslint-disable-line @typescript-eslint/no-unused-vars

        // Adjust amount based on transaction type
        transactionData.amount = transactionData.type === TransactionType.EXPENSE ?
            -Math.abs(transactionData.amount) : Math.abs(transactionData.amount)

        // Create transaction with tag connections if tagIds are provided
        if (tagIds && tagIds.length > 0) {
            return db.transaction.create({
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
            // Create transaction without tags
            return db.transaction.create({
                data: { ...transactionData }
            })
        }
    }
)
