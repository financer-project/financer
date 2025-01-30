import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateHouseholdSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateHouseholdSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const household = await db.household.create({ data: input })

    return household
  },
)
