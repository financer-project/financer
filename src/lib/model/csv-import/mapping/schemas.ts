import { z } from "zod"

export const CreateCSVImportMappingSchema = z.object({
    importId: z.string().uuid(),
    columnName: z.string(),
    fieldName: z.string(),
})

export const UpdateCSVImportMappingSchema = CreateCSVImportMappingSchema.merge(
    z.object({
        id: z.string().uuid(),
        importId: z.string().uuid()
    })
)

export const DeleteCSVImportMappingSchema = z.object({
    id: z.string().uuid()
})
