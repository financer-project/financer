import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { DeleteCSVImportValueMappingSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(DeleteCSVImportValueMappingSchema),
    resolver.authorize(),
    async ({ id }) => {
        return db.cSVImportValueMapping.deleteMany({
            where: { id }
        })
    }
)
