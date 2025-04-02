import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { CreateCSVImportValueMappingSchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(CreateCSVImportValueMappingSchema),
    resolver.authorize(),
    async (input) => {
        return db.cSVImportValueMapping.create({
            data: input
        })
    }
)
