import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { Category } from ".prisma/client"

const GetCategory = z.object({
    id: z.uuid()
})

export default resolver.pipe(
    resolver.zod(GetCategory),
    resolver.authorize(),
    async ({ id }): Promise<Category> => {
        const category = await db.category.findFirst({
            where: { id }
        })

        if (!category) throw new NotFoundError()

        return category
    }
)
