import { z } from "zod"
import { TransactionType } from "@prisma/client"

export const CreateTransactionSchema = z.object({
    accountId: z.uuid(),
    categoryId: z.uuid().nullable(),
    counterpartyId: z.uuid().nullable(),
    type: z.nativeEnum(TransactionType),
    name: z.string().nullable(),
    valueDate: z.date(),
    description: z.string().nullable(),
    amount: z.number(),
    tagIds: z.array(z.uuid()).optional()
})

export const UpdateTransactionSchema = CreateTransactionSchema.merge(
    z.object({
        id: z.uuid()
    })
)

export const DeleteTransactionSchema = z.object({
    id: z.uuid()
})
