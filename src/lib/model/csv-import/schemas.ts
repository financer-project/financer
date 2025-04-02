import { z } from "zod"

export const CreateCSVImportSchema = z.object({
    householdId: z.string().uuid(),
    fileString: z.string(),
    originalFileName: z.string()
})
export const UpdateCSVImportSchema = CreateCSVImportSchema.merge(
    z.object({
        id: z.string().uuid()
    })
)

export const DeleteCSVImportSchema = z.object({
    id: z.string().uuid()
})
