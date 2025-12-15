import { UserSeed } from "@/test/seed/user"
import db from "@/src/lib/db"
import { Household, HouseholdRole } from "@prisma/client"

export interface HouseholdSeed {
    standard: Household
    admin: Household
}

export default async function seedHouseholds(users: UserSeed): Promise<HouseholdSeed> {
    const standard = await db.household.create({
        data: {
            id: "fd04bde4-e366-492c-940c-282f5b86ebbd", // fixed uuid as current household id is stored in session
            name: "My Household",
            currency: "USD",
            description: "My Household description",
            members: {
                create: {
                    userId: users.standard.id,
                    role: HouseholdRole.OWNER
                }
            }
        }
    })

    const admin = await db.household.create({
        data: {
            id: "2d037b2c-2ad2-43f0-9548-bc30b7e7aaf7",
            name: "My Household",
            currency: "USD",
            description: "My Household description",
            members: {
                create: {
                    userId: users.admin.id,
                    role: HouseholdRole.OWNER
                }
            }
        }
    })

    return {
        standard: standard,
        admin: admin
    }
}
