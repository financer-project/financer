import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteHouseholdSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteHouseholdSchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "Household"),
    async ({ id }) => {
        return db.household.deleteMany({ where: { id } })
    }
)
