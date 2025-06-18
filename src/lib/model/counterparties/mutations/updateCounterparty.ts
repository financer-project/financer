import { resolver } from "@blitzjs/rpc"
import { UpdateCounterpartySchema } from "../schemas"
import db from "@/src/lib/db"

export default resolver.pipe(
    resolver.zod(UpdateCounterpartySchema),
    resolver.authorize(),
    async ({ id, householdId, ...data }) => {
        // Ensure the counterparty belongs to the specified household
        const counterparty = await db.counterparty.findFirst({
            where: { id, householdId }
        })

        if (!counterparty) {
            throw new Error("Counterparty not found in this household")
        }

        return db.counterparty.update({
            where: { id },
            data: { ...data, householdId }
        })
    }
)
