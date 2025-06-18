import { z } from "zod"
import { TransactionType } from "@prisma/client"

export const CreateTransactionSchema = z.object({
    accountId: z.string().uuid(),
    categoryId: z.string().uuid().nullable(),
    counterpartyId: z.string().uuid().nullable(),
    type: z.nativeEnum(TransactionType),
    name: z.string(),
    valueDate: z.date(),
    description: z.string().nullable(),
    amount: z.number(),
    tagIds: z.array(z.string().uuid()).optional()
})

export const UpdateTransactionSchema = CreateTransactionSchema.merge(
    z.object({
        id: z.string().uuid()
    })
)

export const DeleteTransactionSchema = z.object({
    id: z.string().uuid()
})
