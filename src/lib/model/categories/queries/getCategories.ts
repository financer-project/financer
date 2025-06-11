import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

const GetCategories = z.object({
    householdId: z.string().uuid().optional()
})

export default resolver.pipe(
    resolver.zod(GetCategories),
    resolver.authorize(),
    async ({ householdId }, ctx) => {
        let id = householdId;

        if (!id) {
            const currentHousehold = await getCurrentHousehold(null, ctx);
            if (!currentHousehold) return [];
            id = currentHousehold.id;
        }

        return db.category.findMany({
            where: { householdId: id }
        })
    }
)
