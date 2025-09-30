import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateCategorySchema } from "../schemas"

async function collectAllDescendantIds(parentId: string): Promise<string[]> {
    // Get all direct children of the parent
    const children = await db.category.findMany({
        where: { parentId },
        select: { id: true }
    })

    const allIds: string[] = []
    
    // Collect all child IDs and recursively collect their descendants
    for (const child of children) {
        allIds.push(child.id)
        const descendantIds = await collectAllDescendantIds(child.id)
        allIds.push(...descendantIds)
    }
    
    return allIds
}

async function updateChildrenColors(parentId: string, color: string | null) {
    // Collect all descendant IDs first
    const allDescendantIds = await collectAllDescendantIds(parentId)
    
    // If there are children to update, perform a single batch update
    if (allDescendantIds.length > 0) {
        await db.category.updateMany({
            where: { 
                id: { in: allDescendantIds }
            },
            data: { color }
        })
    }
}

export default resolver.pipe(
    resolver.zod(UpdateCategorySchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        // Get the current category to check if color actually changed
        const currentCategory = await db.category.findUnique({ where: { id } })
        
        // Update the category
        const updatedCategory = await db.category.update({ where: { id }, data })
        
        // If color was updated and actually changed, recursively update all children
        if ('color' in data && currentCategory && currentCategory.color !== data.color) {
            await updateChildrenColors(id, data.color)
        }
        
        return updatedCategory
    }
)
