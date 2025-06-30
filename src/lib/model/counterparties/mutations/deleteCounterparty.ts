import { resolver } from "@blitzjs/rpc"
import { DeleteCounterpartySchema } from "../schemas"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteCounterpartySchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "Counterparty"),
    async ({ id }) => {
        return db.counterparty.delete({
            where: { id }
        })
    }
)
