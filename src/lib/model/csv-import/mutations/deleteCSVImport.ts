import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { DeleteCSVImportSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(DeleteCSVImportSchema),
    resolver.authorize(),
    async ({ id }) => {
        return await db.cSVImport.deleteMany({ where: { id } })
    }
)
