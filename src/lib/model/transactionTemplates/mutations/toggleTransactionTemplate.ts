import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import Guard from "@/src/lib/guard/ability"

const ToggleTransactionTemplateSchema = z.object({
    id: z.uuid(),
    isActive: z.boolean()
})

export default resolver.pipe(
    resolver.zod(ToggleTransactionTemplateSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "TransactionTemplate"),
    async ({ id, isActive }) => {
        return db.transactionTemplate.update({ where: { id }, data: { isActive } })
    }
)
