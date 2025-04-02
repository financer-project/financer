import { z } from "zod"

export const CreateCSVImportValueMappingSchema = z.object({
    mappingId: z.string().uuid(),
    id: z.string().uuid(),
    originalValue: z.string(),
    mappedValue: z.string()
})
export const UpdateCSVImportValueMappingSchema =
    CreateCSVImportValueMappingSchema.merge(
        z.object({
            id: z.string().uuid(),
            mappingId: z.string().uuid()
        })
    )

export const DeleteCSVImportValueMappingSchema = z.object({
    id: z.string().uuid()
})
