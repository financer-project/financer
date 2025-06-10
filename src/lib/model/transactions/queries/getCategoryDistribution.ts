import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { DateTime } from "luxon"
import { CategoryType } from "@prisma/client"

const GetCategoryDistribution = z.object({
    startDate: z.date().max(DateTime.now().endOf("month").toJSDate()),
    endDate: z.date().max(DateTime.now().endOf("month").toJSDate()).optional(),
    categoryIds: z.array(z.string()).optional() // Optional array of category IDs to filter by
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
    async ({ startDate, endDate, categoryIds }): Promise<CategoryDistribution[]> => {
        endDate ??= DateTime.now().toJSDate()

        // Get all categories to build the hierarchy map
        const allCategories = await db.category.findMany()

        // Build a map of categories by ID for quick lookup
        const categoriesById = new Map(allCategories.map(cat => [cat.id, cat]))

        // Build a map of child categories to their top-level parent
        const topLevelParentMap = new Map<string, string>()

        // For each category, find its top-level parent
        allCategories.forEach(category => {
            let currentId = category.id
            let parentId = category.parentId

            // If this is already a top-level category (no parent), map to itself
            if (!parentId) {
                topLevelParentMap.set(currentId, currentId)
                return
            }

            // Traverse up the hierarchy to find the top-level parent
            while (parentId) {
                currentId = parentId
                const parent = categoriesById.get(parentId)
                parentId = parent?.parentId
            }

            // Map this category to its top-level parent
            topLevelParentMap.set(category.id, currentId)
        })

        // Get all transactions with their categories within the date range
        const transactions = await db.transaction.findMany({
            where: { 
                valueDate: { gte: startDate, lte: endDate },
                categoryId: { not: null }, // Only include transactions with categories
                ...(categoryIds && categoryIds.length > 0 ? {
                    OR: [
                        { categoryId: { in: categoryIds } }, // Direct match
                        { category: { parentId: { in: categoryIds } } } // Child of specified categories
                    ]
                } : {})
            },
            include: {
                category: true
            }
        })

        // Group transactions by top-level parent category
        const categoryMap = new Map<string, CategoryDistribution>()

        transactions.forEach(transaction => {
            if (!transaction.category) return

            // Get the top-level parent category ID
            const categoryId = transaction.category.id
            const topLevelParentId = topLevelParentMap.get(categoryId) || categoryId

            // Get the top-level parent category
            const topLevelCategory = categoriesById.get(topLevelParentId)
            if (!topLevelCategory) return

            if (!categoryMap.has(topLevelParentId)) {
                categoryMap.set(topLevelParentId, {
                    id: topLevelParentId,
                    name: topLevelCategory.name,
                    type: topLevelCategory.type,
                    amount: 0,
                    color: topLevelCategory.color
                })
            }

            // Add the absolute amount to the top-level parent category total
            categoryMap.get(topLevelParentId)!.amount += Math.abs(transaction.amount)
        })

        // If categoryIds is provided, filter to only include those categories
        if (categoryIds && categoryIds.length > 0) {
            return Array.from(categoryMap.values())
                .filter(category => categoryIds.includes(category.id))
        }

        // Otherwise, return all top-level categories
        return Array.from(categoryMap.values())
            .filter(category => {
                const cat = categoriesById.get(category.id)
                return cat && cat.parentId === null
            })
    }
)
