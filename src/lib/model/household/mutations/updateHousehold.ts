import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateHouseholdSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"
import { HouseholdModelInclude } from "@/src/lib/model/household/queries/getHousehold"

export default resolver.pipe(
    resolver.zod(UpdateHouseholdSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Household"),
    async ({ id, ...data }) => {
        return db.household.update({ where: { id }, data, include: HouseholdModelInclude })
    }
)
