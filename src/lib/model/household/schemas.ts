import { z } from "zod"
import currencyCodes from "currency-codes"

const availableCurrencies = currencyCodes.codes()

export const CreateHouseholdSchema = z.object({
    name: z.string().min(3),
    currency: z.enum(availableCurrencies as [string, ...string[]]),
    description: z.string().optional()
})

export const UpdateHouseholdSchema = CreateHouseholdSchema.merge(
    z.object({
        id: z.string().uuid()
    })
)

export const DeleteHouseholdSchema = z.object({
    id: z.string().uuid()
})
