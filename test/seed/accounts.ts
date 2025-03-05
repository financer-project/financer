import { Account } from "@prisma/client"
import db from "@/src/lib/db"
import { HouseholdSeed } from "@/test/seed/households"

export interface AccountSeed {
    standard: Account
    admin: Account
}

export default async function seedAccounts(households: HouseholdSeed): Promise<AccountSeed> {
    const standard = await db.account.create({
        data: {
            household: { connect: { id: households.standard.id } },
            name: "My Account",
            technicalName: "DE11 0000 0000 0000 0000 00"
        }
    })

    const admin = await db.account.create({
        data: {
            household: { connect: { id: households.admin.id } },
            name: "My Account",
            technicalName: "DE11 0000 0000 0000 0000 00"
        }
    })

    return {
        standard: standard,
        admin: admin
    }
}