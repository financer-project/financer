import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { UpdateCSVImportValueMappingSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(UpdateCSVImportValueMappingSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return db.cSVImportValueMapping.update({
            where: { id },
            data
        })
    }
)
