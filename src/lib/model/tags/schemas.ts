import { z } from "zod"
import ColorType from "@/src/lib/model/common/ColorType"

export const CreateTagSchema = z.object({
    householdId: z.uuid(),
    name: z.string().min(3),
    description: z.string().nullable(),
    color: z.nativeEnum(ColorType).nullable()
})
export const UpdateTagSchema = CreateTagSchema.merge(
    z.object({
        id: z.uuid()
    })
)

export const DeleteTagSchema = z.object({
    id: z.uuid()
})
