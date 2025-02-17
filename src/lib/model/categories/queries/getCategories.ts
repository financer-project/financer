import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"

const GetCategories = z.object({
    householdId: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCategories),
    resolver.authorize(),
    async ({ householdId }) => {
        return db.category.findMany({
            where: { householdId: householdId }
        })
    }
)
