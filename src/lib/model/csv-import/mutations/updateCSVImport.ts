import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { UpdateCSVImportSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(UpdateCSVImportSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return db.cSVImport.update({ where: { id }, data })
    }
)
