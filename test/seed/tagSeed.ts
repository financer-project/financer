import { Tag } from ".prisma/client"
import db from "@/src/lib/db"
import { Household } from "@prisma/client"
import { HouseholdSeed } from "@/test/seed/households"
import ColorType from "@/src/lib/model/common/ColorType"

export interface TagSeed {
    standard: {
        work: Tag,
        personal: Tag
    },
    admin: {
        work: Tag,
        personal: Tag
    }
}

export default async function seedTags(households: HouseholdSeed): Promise<TagSeed> {
    const createWorkTag = async (household: Household) => db.tag.create({
        data: {
            name: "Work",
            description: "Work-related expenses",
            color: ColorType.BLUE,
            household: { connect: { id: household.id } }
        }
    })

    const createPersonalTag = async (household: Household) => db.tag.create({
        data: {
            name: "Personal",
            description: "Personal expenses",
            color: ColorType.GREEN,
            household: { connect: { id: household.id } }
        }
    })

    return {
        standard: {
            work: await createWorkTag(households.standard),
            personal: await createPersonalTag(households.standard)
        },
        admin: {
            work: await createWorkTag(households.admin),
            personal: await createPersonalTag(households.admin)
        }
    }
}