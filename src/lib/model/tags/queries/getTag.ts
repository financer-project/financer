import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"

const GetTag = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetTag),
    resolver.authorize(),
    Guard.authorizePipe("read", "Tag"),
    async ({ id }) => {
        const tag = await db.tag.findFirst({ where: { id } })

        if (!tag) throw new NotFoundError()

        return tag
    }
)
