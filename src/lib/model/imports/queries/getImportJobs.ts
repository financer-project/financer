import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { Prisma } from "@prisma/client"
import { paginate } from "blitz"
import { z } from "zod"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"
import Guard from "@/src/lib/guard/ability"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

export const GetImportJobsSchema =
    getFindManySchema<Prisma.ImportJobWhereInput, Prisma.ImportJobOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

export default resolver.pipe(
    resolver.zod(GetImportJobsSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }, ctx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }

        orderBy ??= { createdAt: "desc" }
        const whereWithHousehold: Prisma.ImportJobWhereInput = {
            ...where,
            householdId
        }

        const { items: importJobs, hasMore, nextPage, count } = await paginate({
            skip,
            take,
            count: () => db.importJob.count({ where: whereWithHousehold }),
            query: (paginateArgs) => db.importJob.findMany({
                ...paginateArgs,
                where: whereWithHousehold,
                orderBy,
                include: {
                    columnMappings: true,
                    valueMappings: true,
                    _count: { select: { transactions: true } }
                }
            })
        })

        return { importJobs, nextPage, hasMore, count }
    }
)