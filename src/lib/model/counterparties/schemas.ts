import { z } from "zod"
import { CounterpartyType } from "@prisma/client"

export const CreateCounterpartySchema = z.object({
    householdId: z.string().uuid(),
    name: z.string().min(1),
    type: z.nativeEnum(CounterpartyType),
    description: z.string().nullable(),
    accountName: z.string().nullable(),
    webAddress: z.string().nullable()
})

export const UpdateCounterpartySchema = CreateCounterpartySchema.merge(
    z.object({
        id: z.string().uuid()
    })
)

export const DeleteCounterpartySchema = z.object({
    id: z.string().uuid()
})
