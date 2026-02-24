import { Counterparty } from ".prisma/client"
import db from "@/src/lib/db"
import { CounterpartyType, Household } from "@prisma/client"
import { HouseholdSeed } from "@/test/seed/households"

export interface CounterpartySeed {
    standard: {
        merchant: Counterparty,
        employer: Counterparty,
        utility: Counterparty
    },
    admin: {
        merchant: Counterparty,
        employer: Counterparty,
        utility: Counterparty
    }
}

export default async function seedCounterparties(households: HouseholdSeed): Promise<CounterpartySeed> {
    const createMerchantCounterparty = async (household: Household) => db.counterparty.create({
        data: {
            name: "Test Merchant",
            type: CounterpartyType.MERCHANT,
            description: "A test merchant counterparty",
            accountName: null,
            webAddress: "https://merchant.example.com",
            household: { connect: { id: household.id } }
        }
    })

    const createEmployerCounterparty = async (household: Household) => db.counterparty.create({
        data: {
            name: "Test Employer",
            type: CounterpartyType.EMPLOYER,
            description: "A test employer counterparty",
            accountName: "Employer Account",
            webAddress: null,
            household: { connect: { id: household.id } }
        }
    })

    const createUtilityCounterparty = async (household: Household) => db.counterparty.create({
        data: {
            name: "Test Utility",
            type: CounterpartyType.UTILITY,
            description: "A test utility counterparty",
            accountName: "Utility Account",
            webAddress: "https://utility.example.com",
            household: { connect: { id: household.id } }
        }
    })

    return {
        standard: {
            merchant: await createMerchantCounterparty(households.standard),
            employer: await createEmployerCounterparty(households.standard),
            utility: await createUtilityCounterparty(households.standard)
        },
        admin: {
            merchant: await createMerchantCounterparty(households.admin),
            employer: await createEmployerCounterparty(households.admin),
            utility: await createUtilityCounterparty(households.admin)
        }
    }
}