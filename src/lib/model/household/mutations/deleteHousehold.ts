import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteHouseholdSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(DeleteHouseholdSchema),
    resolver.authorize(),
    async ({ id }) => {
        return db.household.deleteMany({ where: { id } })
    }
)
