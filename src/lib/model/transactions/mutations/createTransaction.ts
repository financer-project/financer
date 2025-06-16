import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateTransactionSchema } from "../schemas"
import { TransactionType } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(CreateTransactionSchema),
    resolver.authorize(),
    async (transaction) => {
        const { tagIds, ...transactionData } = transaction;

        // Adjust amount based on transaction type
        transactionData.amount = transactionData.type === TransactionType.EXPENSE ? 
            -Math.abs(transactionData.amount) : Math.abs(transactionData.amount);

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
            });
        } else {
            // Create transaction without tags
            return db.transaction.create({ 
                data: { ...transactionData } 
            });
        }
    }
)
