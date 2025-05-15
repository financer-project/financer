import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { Prisma } from "@prisma/client"
import { AuthenticatedCtx, paginate } from "blitz"

export default resolver.pipe(
    resolver.authorize(),
    async ({
               where,
               orderBy,
               skip = 0,
               take = 100
           }: Pick<Prisma.ImportJobFindManyArgs, "where" | "orderBy" | "skip" | "take">, ctx: AuthenticatedCtx) => {
        const userId = ctx.session.userId

        if (!userId) {
            throw new Error("User is not authenticated")
        }

        orderBy ??= { createdAt: "desc" }

        const {
            items: importJobs,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.importJob.count({ where }),
            query: (paginateArgs) => db.importJob.findMany({
                ...paginateArgs, where, orderBy,
                include: {
                    columnMappings: true,
                    valueMappings: true,
                    _count: {
                        select: {
                            transactions: true
                        }
                    }
                }
            })
        })

        return {
            importJobs,
            nextPage,
            hasMore,
            count
        }
    }
)