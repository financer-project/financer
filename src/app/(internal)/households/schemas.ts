import { z } from "zod"
import currencyCodes from "currency-codes"

const availableCurrencies = currencyCodes.codes()

export const CreateHouseholdSchema = z.object({
  name: z.string(),
  currency: z.enum(availableCurrencies as [string, ...string[]]), // Typsicherheit sicherstellen
})

export const UpdateHouseholdSchema = CreateHouseholdSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
)

export const DeleteHouseholdSchema = z.object({
  id: z.string().uuid(),
})
