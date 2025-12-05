import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { Role } from "@prisma/client"
import { z } from "zod"
import { Ctx } from "blitz"

// Schema for the onboarding mutation input
const ProcessOnboardingSchema = z.object({
    // User data
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(10, "Password must be at least 10 characters"),

    // Household data
    householdName: z.string().min(3, "Household name must be at least 3 characters"),
    currency: z.string().min(1, "Currency is required"),
    description: z.string().nullable().optional(),

    // Admin settings
    defaultLanguage: z.string().default("en-US"),
    defaultTheme: z.string().default("light"),
    allowRegistration: z.boolean().default(true),

    // Optional SMTP settings
    smtpHost: z.string().nullable().optional(),
    smtpPort: z.number().nullable().optional(),
    smtpUser: z.string().nullable().optional(),
    smtpPassword: z.string().nullable().optional(),
    smtpFromEmail: z.email().nullable().optional(),
    smtpFromName: z.string().nullable().optional(),
    smtpEncryption: z.string().nullable().optional(),

    // Security settings with defaults
    invitationTokenExpirationHours: z.number().min(1).max(168).default(72),
    resetPasswordTokenExpirationHours: z.number().min(1).max(24).default(4)
})

export default resolver.pipe(
    resolver.zod(ProcessOnboardingSchema),
    async (input, ctx: Ctx) => {
        const blitzContext = ctx

        // Check if onboarding is actually needed
        const userCount = await db.user.count()
        if (userCount > 0) {
            const adminSettings = await db.adminSettings.findFirst({
                select: { onboardingCompleted: true }
            })
            if (adminSettings?.onboardingCompleted) {
                throw new Error("Onboarding has already been completed")
            }
        }

        // Use transaction to ensure all operations succeed or none do
        const result = await db.$transaction(async (tx) => {
            // Step 1: Create admin user
            const hashedPassword = await SecurePassword.hash(input.password)
            const user = await tx.user.create({
                data: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email,
                    hashedPassword: hashedPassword,
                    role: Role.ADMIN // Make the first user an admin
                }
            })

            // Step 2: Create household
            const household = await tx.household.create({
                data: {
                    name: input.householdName,
                    currency: input.currency,
                    description: input.description || null,
                    ownerId: user.id
                }
            })

            // Step 3: Update admin settings to mark onboarding complete
            const adminSettings = await tx.adminSettings.upsert({
                where: { id: 1 },
                update: {
                    defaultLanguage: input.defaultLanguage,
                    defaultTheme: input.defaultTheme,
                    allowRegistration: input.allowRegistration,
                    smtpHost: input.smtpHost || null,
                    smtpPort: input.smtpPort || null,
                    smtpUser: input.smtpUser || null,
                    smtpPassword: input.smtpPassword || null,
                    smtpFromEmail: input.smtpFromEmail || null,
                    smtpFromName: input.smtpFromName || null,
                    smtpEncryption: input.smtpEncryption || null,
                    invitationTokenExpirationHours: input.invitationTokenExpirationHours,
                    resetPasswordTokenExpirationHours: input.resetPasswordTokenExpirationHours,
                    onboardingCompleted: true
                },
                create: {
                    id: 1,
                    defaultLanguage: input.defaultLanguage,
                    defaultTheme: input.defaultTheme,
                    allowRegistration: input.allowRegistration,
                    smtpHost: input.smtpHost || null,
                    smtpPort: input.smtpPort || null,
                    smtpUser: input.smtpUser || null,
                    smtpPassword: input.smtpPassword || null,
                    smtpFromEmail: input.smtpFromEmail || null,
                    smtpFromName: input.smtpFromName || null,
                    smtpEncryption: input.smtpEncryption || null,
                    invitationTokenExpirationHours: input.invitationTokenExpirationHours,
                    resetPasswordTokenExpirationHours: input.resetPasswordTokenExpirationHours,
                    onboardingCompleted: true
                }
            })

            return {
                user,
                household,
                adminSettings
            }
        })

        // Step 4: Create session for the new admin user
        await blitzContext.session.$create({
            userId: result.user.id,
            email: result.user.email,
            role: Role.ADMIN
        })

        return {
            userId: blitzContext.session.userId,
            user: {
                id: result.user.id,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                email: result.user.email,
                role: result.user.role
            },
            household: {
                id: result.household.id,
                name: result.household.name,
                currency: result.household.currency,
                description: result.household.description
            },
            onboardingCompleted: true
        }
    }
)