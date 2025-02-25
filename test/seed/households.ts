import { UserSeed } from "@/test/seed/user"
import db from "@/src/lib/db"
import { Household } from "@prisma/client"

export interface HouseholdSeed {
    standard: Household
    admin: Household
}

export default async function seedHouseholds(users: UserSeed): Promise<HouseholdSeed> {
    const standard = await db.household.create({
        data: {
            owner: { connect: { id: users.standard.id } },
            name: "My Household",
            currency: "USD",
            description: "My Household description"
        }
    })

    const admin = await db.household.create({
        data: {
            owner: { connect: { id: users.admin.id } },
            name: "My Household",
            currency: "USD",
            description: "My Household description"
        }
    })

    return {
        standard: standard,
        admin: admin
    }
}