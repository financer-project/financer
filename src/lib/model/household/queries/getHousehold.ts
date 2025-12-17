import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { z } from "zod"
import Guard from "@/src/lib/guard/ability"

const GetHousehold = z.object({
    id: z.uuid()
})

export const HouseholdModelInclude = {
    members: {
        include: {
            user: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        }
    }
}

export type HouseholdModel = Prisma.HouseholdGetPayload<{
    include: {
        members: {
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true }
                }
            }
        }
    }
}>;

export default resolver.pipe(
    resolver.zod(GetHousehold),
    resolver.authorize(),
    Guard.authorizePipe("read", "Household"),
    async ({ id }): Promise<HouseholdModel> => {
        const household = await db.household.findFirst({
            where: { id },
            include: HouseholdModelInclude
        })
        if (!household) throw new NotFoundError()
        return household
    }
)
