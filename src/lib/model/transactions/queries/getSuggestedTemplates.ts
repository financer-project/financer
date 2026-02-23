import { resolver } from "@blitzjs/rpc"
import { AuthenticatedCtx } from "blitz"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { detectRecurringTransactions } from "../services/recurringTransactionDetector"

export default resolver.pipe(
    resolver.authorize(),
    async (_: null, ctx: AuthenticatedCtx) => {
        const household = await getCurrentHousehold(null, ctx)
        if (!household) return []
        return detectRecurringTransactions(household.id)
    }
)
