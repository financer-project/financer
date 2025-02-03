import { z } from "zod"

export const CreateAccountSchema = z.object({
    householdId: z.string().uuid(),
    name: z.string(),
    technicalName: z.string().optional()
})
export const UpdateAccountSchema = CreateAccountSchema.merge(
    z.object({
        id: z.string(),
        householdId: z.string()
    })
)

export const DeleteAccountSchema = z.object({
    id: z.string()
})
