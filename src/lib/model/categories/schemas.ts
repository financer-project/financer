import { z } from "zod"
import { CategoryType } from "@prisma/client"

export const CreateCategorySchema = z.object({
    householdId: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    name: z.string(),
    type: z.nativeEnum(CategoryType)
})
export const UpdateCategorySchema = CreateCategorySchema.merge(
    z.object({
        id: z.string().uuid()
    })
)

export const DeleteCategorySchema = z.object({
    id: z.string().uuid()
})
