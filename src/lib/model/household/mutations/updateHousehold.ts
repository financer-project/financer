import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { UpdateHouseholdSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateHouseholdSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const household = await db.household.update({ where: { id }, data })

    return household
  },
)
