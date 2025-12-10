import { beforeEach, describe, expect, it, vi } from "vitest"
import db from "@/src/lib/db"
import processOnboarding from "@/src/lib/model/onboarding/mutations/processOnboarding"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { Role } from "@prisma/client"

// Mock SecurePassword
vi.mock("@blitzjs/auth/secure-password", () => ({
    SecurePassword: {
        hash: vi.fn().mockResolvedValue("hashedPassword123")
    }
}))

describe("processOnboarding", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()
    })

    const validOnboardingData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "securePassword123",
        householdName: "Doe Family",
        currency: "USD",
        description: "Family household for managing finances",
        defaultLanguage: "en-US",
        defaultTheme: "light",
        allowRegistration: true,
        invitationTokenExpirationHours: 72,
        resetPasswordTokenExpirationHours: 4
    }

    describe("successful onboarding", () => {
        it("should complete onboarding process successfully when no users exist", async () => {
            // Ensure no users exist
            await db.user.deleteMany()
            await db.adminSettings.deleteMany()

            const mockContext = utils.getMockContext("none")
            mockContext.session.$create = vi.fn().mockResolvedValue({})

            const result = await processOnboarding(validOnboardingData, mockContext)

            // Verify user creation
            const createdUser = await db.user.findUnique({
                where: { email: validOnboardingData.email }
            })
            expect(createdUser).toBeTruthy()
            expect(createdUser?.firstName).toBe(validOnboardingData.firstName)
            expect(createdUser?.lastName).toBe(validOnboardingData.lastName)
            expect(createdUser?.email).toBe(validOnboardingData.email)
            expect(createdUser?.role).toBe(Role.ADMIN)
            expect(createdUser?.hashedPassword).toBe("hashedPassword123")

            // Verify household creation
            const createdHousehold = await db.household.findFirst({
                where: { name: validOnboardingData.householdName },
                include: { members: true }
            })
            expect(createdHousehold).toBeTruthy()
            expect(createdHousehold?.name).toBe(validOnboardingData.householdName)
            expect(createdHousehold?.currency).toBe(validOnboardingData.currency)
            expect(createdHousehold?.description).toBe(validOnboardingData.description)
            expect(createdHousehold?.members?.[0]?.userId).toBe(createdUser?.id)

            // Verify admin settings creation/update
            const adminSettings = await db.adminSettings.findFirst()
            expect(adminSettings).toBeTruthy()
            expect(adminSettings?.onboardingCompleted).toBe(true)
            expect(adminSettings?.defaultLanguage).toBe(validOnboardingData.defaultLanguage)
            expect(adminSettings?.defaultTheme).toBe(validOnboardingData.defaultTheme)
            expect(adminSettings?.allowRegistration).toBe(validOnboardingData.allowRegistration)
            expect(adminSettings?.invitationTokenExpirationHours).toBe(validOnboardingData.invitationTokenExpirationHours)
            expect(adminSettings?.resetPasswordTokenExpirationHours).toBe(validOnboardingData.resetPasswordTokenExpirationHours)

            // Verify session creation was called
            expect(mockContext.session.$create).toHaveBeenCalledWith({
                userId: createdUser?.id,
                email: createdUser?.email,
                role: Role.ADMIN
            })

            // Verify return value
            expect(result).toMatchObject({
                user: {
                    id: createdUser?.id,
                    firstName: validOnboardingData.firstName,
                    lastName: validOnboardingData.lastName,
                    email: validOnboardingData.email,
                    role: Role.ADMIN
                },
                household: {
                    id: createdHousehold?.id,
                    name: validOnboardingData.householdName,
                    currency: validOnboardingData.currency,
                    description: validOnboardingData.description
                },
                onboardingCompleted: true
            })

            // Verify SecurePassword.hash was called
            expect(SecurePassword.hash).toHaveBeenCalledWith(validOnboardingData.password)
        })

        it("should complete onboarding with optional SMTP settings", async () => {
            await db.user.deleteMany()
            await db.adminSettings.deleteMany()

            const onboardingDataWithSmtp = {
                ...validOnboardingData,
                smtpHost: "smtp.example.com",
                smtpPort: 587,
                smtpUser: "smtp@example.com",
                smtpPassword: "smtpPassword",
                smtpFromEmail: "noreply@example.com",
                smtpFromName: "Example App",
                smtpEncryption: "tls"
            }

            const mockContext = utils.getMockContext("none")
            mockContext.session.$create = vi.fn().mockResolvedValue({})

            await processOnboarding(onboardingDataWithSmtp, mockContext)

            const adminSettings = await db.adminSettings.findFirst()
            expect(adminSettings?.smtpHost).toBe(onboardingDataWithSmtp.smtpHost)
            expect(adminSettings?.smtpPort).toBe(onboardingDataWithSmtp.smtpPort)
            expect(adminSettings?.smtpUser).toBe(onboardingDataWithSmtp.smtpUser)
            expect(adminSettings?.smtpPassword).toBe(onboardingDataWithSmtp.smtpPassword)
            expect(adminSettings?.smtpFromEmail).toBe(onboardingDataWithSmtp.smtpFromEmail)
            expect(adminSettings?.smtpFromName).toBe(onboardingDataWithSmtp.smtpFromName)
            expect(adminSettings?.smtpEncryption).toBe(onboardingDataWithSmtp.smtpEncryption)
        })
    })

    describe("error cases", () => {
        it("should throw error when onboarding already completed", async () => {
            // Set up existing user and completed onboarding
            const existingUser = await db.user.create({
                data: {
                    firstName: "Existing",
                    lastName: "User",
                    email: "existing@example.com",
                    hashedPassword: "hashedPassword",
                    role: Role.ADMIN
                }
            })

            await db.adminSettings.upsert({
                where: { id: 1 },
                update: {
                    onboardingCompleted: true
                },
                create: {
                    id: 1,
                    onboardingCompleted: true
                }
            })

            const mockContext = utils.getMockContext("none")

            await expect(processOnboarding(validOnboardingData, mockContext))
                .rejects.toThrow("Onboarding has already been completed")
        })

        it("should validate required fields", async () => {
            await db.user.deleteMany()

            const invalidData = {
                ...validOnboardingData,
                firstName: "", // Empty first name should fail validation
                email: "invalid-email" // Invalid email should fail validation
            }

            const mockContext = utils.getMockContext("none")

            await expect(processOnboarding(invalidData, mockContext))
                .rejects.toThrow()
        })

        it("should validate password length", async () => {
            await db.user.deleteMany()

            const invalidData = {
                ...validOnboardingData,
                password: "short" // Too short password
            }

            const mockContext = utils.getMockContext("none")

            await expect(processOnboarding(invalidData, mockContext))
                .rejects.toThrow()
        })

        it("should validate household name length", async () => {
            await db.user.deleteMany()

            const invalidData = {
                ...validOnboardingData,
                householdName: "AB" // Too short household name
            }

            const mockContext = utils.getMockContext("none")

            await expect(processOnboarding(invalidData, mockContext))
                .rejects.toThrow()
        })

        it("should validate security settings bounds", async () => {
            await db.user.deleteMany()

            const invalidData = {
                ...validOnboardingData,
                invitationTokenExpirationHours: 200, // Too high (max 168)
                resetPasswordTokenExpirationHours: 0 // Too low (min 1)
            }

            const mockContext = utils.getMockContext("none")

            await expect(processOnboarding(invalidData, mockContext))
                .rejects.toThrow()
        })
    })

    describe("transaction behavior", () => {
        it("should rollback transaction if household creation fails", async () => {
            await db.user.deleteMany()
            await db.adminSettings.deleteMany()

            // Mock db.household.create to throw an error
            const originalCreate = db.household.create
            vi.spyOn(db.household, "create").mockRejectedValueOnce(new Error("Household creation failed"))

            const mockContext = utils.getMockContext("none")
            mockContext.session.$create = vi.fn().mockResolvedValue({})

            await expect(processOnboarding(validOnboardingData, mockContext))
                .rejects.toThrow("Household creation failed")

            // Verify no user was created (transaction rolled back)
            const userCount = await db.user.count()
            expect(userCount).toBe(0)

            // Verify no admin settings were created
            const adminSettings = await db.adminSettings.findFirst()
            expect(adminSettings).toBeNull()

            // Restore original method
            db.household.create = originalCreate
        })

        it("should not create session if transaction fails", async () => {
            await db.user.deleteMany()
            await db.adminSettings.deleteMany()

            // Mock admin settings creation to fail
            const originalUpsert = db.adminSettings.upsert
            vi.spyOn(db.adminSettings, "upsert").mockRejectedValueOnce(new Error("Admin settings failed"))

            const mockContext = utils.getMockContext("none")
            mockContext.session.$create = vi.fn().mockResolvedValue({})

            await expect(processOnboarding(validOnboardingData, mockContext))
                .rejects.toThrow("Admin settings failed")

            // Verify session creation was not called
            expect(mockContext.session.$create).not.toHaveBeenCalled()

            // Restore original method
            db.adminSettings.upsert = originalUpsert
        })
    })
})