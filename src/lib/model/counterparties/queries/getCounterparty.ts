import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import Guard from "@/src/lib/guard/ability"

const GetCounterparty = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCounterparty),
    resolver.authorize(),
    Guard.authorizePipe("read", "Counterparty"),
    async ({ id }) => {
        // First, find the counterparty without authorization check
        const counterparty = await db.counterparty.findUnique({
            where: { id },
            include: { household: true }
        })

        if (!counterparty) throw new NotFoundError()

        return counterparty
    }
)
