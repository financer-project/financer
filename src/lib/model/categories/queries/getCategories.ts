import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { z } from "zod"

const GetCategories = z.object({
    householdId: z.string().uuid()
})

async function fetchCategoriesRecursively(householdId: string, parentId: string | null = null) {
    const categories = await db.category.findMany({
        where: { parentId: parentId }, // Fetch categories where parentId matches (or null for root categories)
        include: { children: true } // Recursively include children
    })

    // Fetch children recursively for each category
    for (const category of categories) {
        if (category.children?.length) {
            category.children = await fetchCategoriesRecursively(householdId, category.id)
        }
    }

    return categories
}

// Resolver to provide the recursive category tree
export default resolver.pipe(
    resolver.zod(GetCategories),
    resolver.authorize(),
    async ({ householdId }) => {
        return await fetchCategoriesRecursively(householdId, null)
    }
)
