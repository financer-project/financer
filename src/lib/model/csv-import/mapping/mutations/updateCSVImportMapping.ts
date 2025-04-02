import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { UpdateCSVImportMappingSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(UpdateCSVImportMappingSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return db.cSVImportMapping.update({
            where: { id },
            data
        })
    }
)
