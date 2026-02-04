import { z } from "zod"
import currencyCodes from "currency-codes"
import { HouseholdRole } from "@prisma/client"

const availableCurrencies = currencyCodes.codes()

export const CreateHouseholdSchema = z.object({
    name: z.string().min(3),
    currency: z.enum(availableCurrencies as [string, ...string[]]),
    description: z.string().nullable()
})

export const UpdateHouseholdSchema = CreateHouseholdSchema.extend({
    id: z.uuid()
})

export const DeleteHouseholdSchema = z.object({
    id: z.uuid()
})

// Membership management schemas

// Email-based add-or-invite flow (used by UI form)
export const AddOrInviteHouseholdMemberSchema = z.object({
    // Household ID (named `id` to align with Guard.authorizePipe("invite", "Household"))
    id: z.uuid(),
    email: z.email(),
    role: z.enum(HouseholdRole).default(HouseholdRole.MEMBER)
})

// ID-based add-only mutation (used by signup flow and internal logic)
export const AddHouseholdMemberSchema = z.object({
    id: z.uuid(), // householdId
    userId: z.uuid(),
    role: z.enum(HouseholdRole).default(HouseholdRole.MEMBER)
})

export const UpdateHouseholdMemberSchema = z.object({
    // Household ID (named `id` to align with Guard.authorizePipe("update", "Household"))
    id: z.uuid(),
    userId: z.uuid(),
    role: z.enum(HouseholdRole)
})

export const RemoveHouseholdMemberSchema = z.object({
    // Household ID (named `id` to align with Guard.authorizePipe("update", "Household"))
    id: z.uuid(),
    userId: z.uuid()
})

export const SetDefaultAccountSchema = z.object({
    householdId: z.uuid(),
    accountId: z.uuid().nullable()
})
