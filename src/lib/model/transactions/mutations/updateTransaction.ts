import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateTransactionSchema } from "../schemas"
import { TransactionType } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(UpdateTransactionSchema),
    resolver.authorize(),
    async ({ id, ...transaction }) => {
        const { tagIds, ...transactionData } = transaction;

        // Adjust amount based on transaction type
        transactionData.amount = transactionData.type === TransactionType.EXPENSE ? 
            -Math.abs(transactionData.amount) : Math.abs(transactionData.amount);

        // First, delete all existing tag relationships for this transaction
        await db.transactonTags.deleteMany({
            where: { transactionId: id }
        });

        // Update transaction with new tag connections if tagIds are provided
        if (tagIds && tagIds.length > 0) {
            return db.transaction.update({
                where: { id },
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
            });
        } else {
            // Update transaction without tags
            return db.transaction.update({ 
                where: { id }, 
                data: { ...transactionData } 
            });
        }
    }
)
