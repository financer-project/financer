import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { z } from "zod"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"
import TransactionTemplateWhereInput = Prisma.TransactionTemplateWhereInput
import TransactionTemplateOrderByWithRelationInput = Prisma.TransactionTemplateOrderByWithRelationInput

export const GetTransactionTemplatesSchema =
    getFindManySchema<TransactionTemplateWhereInput, TransactionTemplateOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

type GetTransactionTemplatesInput =
    Pick<Prisma.TransactionTemplateFindManyArgs, "where" | "orderBy" | "skip" | "take">
    & z.infer<typeof GetTransactionTemplatesSchema>

export default resolver.pipe(
    resolver.zod(GetTransactionTemplatesSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }: GetTransactionTemplatesInput, ctx: AuthenticatedCtx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }

        orderBy ??= { name: "asc" }
        where = { ...where, householdId }

        const { items: transactionTemplates, hasMore, nextPage, count } = await paginate({
            skip,
            take,
            count: () => db.transactionTemplate.count({ where }),
            query: (paginateArgs) => db.transactionTemplate.findMany({
                ...paginateArgs,
                where,
                orderBy,
                include: {
                    account: true,
                    category: true,
                    counterparty: true
                }
            })
        })

        return { transactionTemplates, nextPage, hasMore, count }
    }
)
