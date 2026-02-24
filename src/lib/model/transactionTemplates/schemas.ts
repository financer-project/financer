import { z } from "zod"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"

export const CreateTransactionTemplateSchema = z.object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    type: z.enum(TransactionType),
    amount: z.number().positive(),
    frequency: z.enum(RecurrenceFrequency),
    startDate: z.date(),
    endDate: z.date().nullable().optional(),
    accountId: z.uuid(),
    categoryId: z.uuid().nullable().optional(),
    counterpartyId: z.uuid().nullable().optional()
})

export const UpdateTransactionTemplateSchema = CreateTransactionTemplateSchema.extend({
    id: z.uuid()
})

export const DeleteTransactionTemplateSchema = z.object({
    id: z.uuid()
})
