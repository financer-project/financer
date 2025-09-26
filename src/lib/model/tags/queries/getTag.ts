import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import db from "@/src/lib/db"

const GetTag = z.object({
    id: z.uuid()
})

export default resolver.pipe(
    resolver.zod(GetTag),
    resolver.authorize(),
    async ({ id }) => {
        const tag = await db.tag.findFirst({ where: { id } })

        if (!tag) throw new NotFoundError()

        return tag
    }
)
