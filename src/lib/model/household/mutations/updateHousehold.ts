import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateHouseholdSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(UpdateHouseholdSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Household"),
    async ({ id, ...data }) => {
        return db.household.update({ where: { id }, data })
    }
)
