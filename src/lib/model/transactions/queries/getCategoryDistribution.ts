import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { DateTime } from "luxon"
import { CategoryType } from "@prisma/client"
import db from "@/src/lib/db"
import { Tree } from "@/src/lib/model/categories/Tree"
import { Category } from ".prisma/client"


const GetCategoryDistribution = z.object({
    startDate: z.date().max(DateTime.now().endOf("month").toJSDate()),
    endDate: z.date().max(DateTime.now().endOf("month").toJSDate()).optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
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
    async ({ startDate, endDate, categoryIds, includeUncategorized }): Promise<CategoryDistribution[]> => {
        const result: CategoryDistribution[] = []

        endDate ??= DateTime.now().endOf("month").toJSDate()

        let categoryTree: Tree<Category> = Tree.fromFlatList(await db.category.findMany(), "id", "parentId")

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
                valueDate: {
                    gte: startDate,
                    lte: endDate
                },
                categoryId: {
                    in: categoryIDsToSelect
                }
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

        return result
    }
)