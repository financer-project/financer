import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"

const GetCSVImportMapping = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCSVImportMapping),
    resolver.authorize(),
    async ({ id }) => {
        const cSVImportMapping = await db.cSVImportMapping.findFirst({
            where: { id }
        })

        if (!cSVImportMapping) throw new NotFoundError()

        return cSVImportMapping
    }
)
