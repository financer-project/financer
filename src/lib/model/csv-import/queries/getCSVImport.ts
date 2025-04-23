import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"

const GetCSVImport = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCSVImport),
    resolver.authorize(),
    async ({ id }) => {
        const cSVImport = await db.cSVImport.findFirst({ where: { id } })

        if (!cSVImport) throw new NotFoundError()

        return cSVImport
    }
)
