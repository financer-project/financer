import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"

const GetCSVImportValueMapping = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCSVImportValueMapping),
    resolver.authorize(),
    async ({ id }) => {
        const cSVImportValueMapping = await db.cSVImportValueMapping.findFirst({
            where: { id }
        })

        if (!cSVImportValueMapping) throw new NotFoundError()

        return cSVImportValueMapping
    }
)
