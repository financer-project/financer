import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { Prisma } from ".prisma/client"

export type CategoryModel = Prisma.CategoryGetPayload<{ include: { children: true } }>;

const GetCategory = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCategory),
    resolver.authorize(),
    async ({ id }): Promise<CategoryModel> => {
        const category = await db.category.findFirst({
            where: { id },
            include: { children: true }
        })

        if (!category) throw new NotFoundError()

        return category
    }
)
