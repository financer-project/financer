import { z } from "zod"
import { CounterpartyType } from "@prisma/client"

export const CreateCounterpartySchema = z.object({
    householdId: z.uuid(),
    name: z.string().min(1),
    type: z.enum(CounterpartyType),
    description: z.string().nullable(),
    accountName: z.string().nullable(),
    webAddress: z.string().nullable()
})

export const UpdateCounterpartySchema = CreateCounterpartySchema.extend({
    id: z.uuid()
})

export const DeleteCounterpartySchema = z.object({
    id: z.uuid()
})
