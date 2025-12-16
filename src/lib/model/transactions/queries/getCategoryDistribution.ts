import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { DateTime } from "luxon"
import { CategoryType, TransactionType } from "@prisma/client"
import db from "@/src/lib/db"
import { Tree } from "@/src/lib/model/categories/Tree"
import { Category } from ".prisma/client"
import ColorType from "@/src/lib/model/common/ColorType"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import Guard from "@/src/lib/guard/ability"
import { NotFoundError } from "blitz"

const GetCategoryDistribution = z.object({
    startDate: z.date().max(DateTime.now().endOf("month").toJSDate()),
    endDate: z.date().max(DateTime.now().endOf("month").toJSDate()).optional(),
    categoryIds: z.array(z.uuid()).optional(),
    includeUncategorized: z.boolean().default(false)
})

export interface CategoryDistribution {
    id: string
    name: string
    type: CategoryType
    amount: number
    color: string | null
}

export default resolver.pipe(
    resolver.zod(GetCategoryDistribution),
    resolver.authorize(),
    async (input, ctx) => {
        const currentHousehold = await getCurrentHousehold(null, ctx)
        if (!currentHousehold) throw new NotFoundError()
        return { id: currentHousehold.id, currentHousehold, ...input }
    },
    Guard.authorizePipe("read", "Household"),
    async ({
               currentHousehold,
               startDate,
               endDate,
               categoryIds,
               includeUncategorized
           }): Promise<CategoryDistribution[]> => {
        const result: CategoryDistribution[] = []

        endDate ??= DateTime.now().toJSDate()

        let categoryTree: Tree<Category> = Tree.fromFlatList(
            await db.category.findMany({
                where: { householdId: currentHousehold.id }
            }),
            "id",
            "parentId"
        )

        // if no categories are given or empty, all root categories are used.
        if (categoryIds && categoryIds.length > 0) {
            categoryTree = categoryTree.filter(category => categoryIds.includes(category.id as string))!
        }

        const categoryIDsToSelect: string[] = []
        categoryTree.getChildren().forEach(category => {
            categoryIDsToSelect.push(...category.flatten().map(category => category.id as string))
        })

        const transactions = await db.transaction.findMany({
            where: {
                account: { householdId: currentHousehold.id },
                valueDate: { gte: startDate, lte: endDate },
                OR: [
                    { categoryId: { in: categoryIDsToSelect } },
                    { categoryId: null }
                ]
            }
        })

        categoryTree.getChildren().forEach(category => {
            result.push({
                ...category.data,
                amount: transactions
                    .filter(transaction =>
                        transaction.categoryId &&
                        category.flatten().map(category => category.id).includes(transaction.categoryId))
                    .reduce((amount, transaction) => amount + transaction.amount, 0)
            })
        })

        if (includeUncategorized) {
            const incomeSum = transactions
                .filter((transaction) => !transaction.categoryId && transaction.type === TransactionType.INCOME)
                .reduce((sum, transaction) => sum + transaction.amount, 0)

            const expenseSum = transactions
                .filter((transaction) => !transaction.categoryId && transaction.type === TransactionType.EXPENSE)
                .reduce((sum, transaction) => sum + transaction.amount, 0)

            result.push({
                id: "uncategorized-income",
                name: "Uncategorized",
                type: CategoryType.INCOME,
                color: ColorType.GRAY,
                amount: incomeSum
            })
            result.push({
                id: "uncategorized-expenses",
                name: "Uncategorized",
                type: CategoryType.EXPENSE,
                color: ColorType.GRAY,
                amount: expenseSum
            })

        }

        return result
    }
)
