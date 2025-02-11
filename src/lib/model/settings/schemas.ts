import { z } from "zod"

export const UpdateSettingSchema = z.object({
    userId: z.string().uuid(),
    language: z.string(),
    theme: z.string()
})

