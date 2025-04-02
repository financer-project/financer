import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"

interface GetCSVImportValueMappingsInput
    extends Pick<
        Prisma.CSVImportValueMappingFindManyArgs,
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
           }: GetCSVImportValueMappingsInput) => {
        const {
            items: cSVImportValueMappings,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.cSVImportValueMapping.count({ where }),
            query: (paginateArgs) =>
                db.cSVImportValueMapping.findMany({ ...paginateArgs, where, orderBy })
        })

        return {
            cSVImportValueMappings,
            nextPage,
            hasMore,
            count
        }
    }
)
