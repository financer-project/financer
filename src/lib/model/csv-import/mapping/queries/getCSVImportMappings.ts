import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"

interface GetCSVImportMappingsInput
    extends Pick<
        Prisma.CSVImportMappingFindManyArgs,
        "where" | "orderBy" | "skip" | "take"
    > {
}

export default resolver.pipe(
    resolver.authorize(),
    async ({
               where,
               orderBy,
               skip = 0,
               take = 100
           }: GetCSVImportMappingsInput) => {
        // TODO: in multi-tenant app, you must add validation to ensure correct tenant
        const {
            items: cSVImportMappings,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.cSVImportMapping.count({ where }),
            query: (paginateArgs) =>
                db.cSVImportMapping.findMany({ ...paginateArgs, where, orderBy })
        })

        return {
            cSVImportMappings,
            nextPage,
            hasMore,
            count
        }
    }
)
