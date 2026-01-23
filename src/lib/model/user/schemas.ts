import { z } from "zod"

export const UpdateProfileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z
        .string()
        .email("Invalid email address")
        .transform((str) => str.toLowerCase().trim())
})

export const ChangePasswordFormSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(10, "Password must be at least 10 characters"),
        confirmPassword: z.string()
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
    })
