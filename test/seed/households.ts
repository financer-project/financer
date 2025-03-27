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
            id: "fd04bde4-e366-492c-940c-282f5b86ebbd", // fixed uuid as current household id is stored in session
            owner: { connect: { id: users.standard.id } },
            name: "My Household",
            currency: "USD",
            description: "My Household description"
        }
    })

    const admin = await db.household.create({
        data: {
            id: "2d037b2c-2ad2-43f0-9548-bc30b7e7aaf7",
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