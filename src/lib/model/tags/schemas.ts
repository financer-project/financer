import { z } from "zod"
import ColorType from "@/src/lib/model/common/ColorType"

export const CreateTagSchema = z.object({
    householdId: z.uuid(),
    name: z.string().min(3),
    description: z.string().nullable(),
    color: z.enum(ColorType).nullable()
})
export const UpdateTagSchema = CreateTagSchema.extend(
    z.object({
        id: z.uuid()
    })
)

export const DeleteTagSchema = z.object({
    id: z.uuid()
})
