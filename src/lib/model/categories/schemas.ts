import { z } from "zod"
import { CategoryType } from "@prisma/client"
import ColorType from "@/src/lib/model/common/ColorType"

export const CreateCategorySchema = z.object({
    householdId: z.uuid(),
    parentId: z.uuid().nullable(),
    name: z.string().min(3),
    type: z.nativeEnum(CategoryType),
    color: z.nativeEnum(ColorType).nullable()
})

export const UpdateCategorySchema = CreateCategorySchema.merge(
    z.object({
        id: z.uuid()
    })
)

export const DeleteCategorySchema = z.object({
    id: z.uuid()
})
