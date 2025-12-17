import { z } from "zod"
import { CategoryType } from "@prisma/client"
import ColorType from "@/src/lib/model/common/ColorType"

export const CreateCategorySchema = z.object({
    householdId: z.uuid(),
    parentId: z.uuid().nullable(),
    name: z.string().min(3),
    type: z.enum(CategoryType),
    color: z.enum(ColorType).nullable()
})

export const UpdateCategorySchema = CreateCategorySchema.extend({
    id: z.uuid()
})

export const DeleteCategorySchema = z.object({
    id: z.uuid()
})
