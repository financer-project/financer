import { z } from "zod"

export const CreateAccountSchema = z.object({
    householdId: z.uuid(),
    name: z.string().min(3),
    technicalIdentifier: z.string().nullable()
})
export const UpdateAccountSchema = CreateAccountSchema.extend({
    id: z.string(),
    householdId: z.string()
})

export const DeleteAccountSchema = z.object({
    id: z.string()
})
