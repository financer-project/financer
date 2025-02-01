import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { DeleteHouseholdSchema } from "../../../../app/(internal)/households/schemas"

export default resolver.pipe(
  resolver.zod(DeleteHouseholdSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const household = await db.household.deleteMany({ where: { id } })

    return household
  },
)
