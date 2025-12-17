import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { Prisma } from ".prisma/client"
import Guard from "@/src/lib/guard/ability"

const GetAccount = z.object({
    id: z.uuid()
})

export type AccountModel = Prisma.AccountGetPayload<{ include: { household: true } }>;

export default resolver.pipe(
    resolver.zod(GetAccount),
    resolver.authorize(),
    Guard.authorizePipe("read", "Account"),
    async ({ id }): Promise<AccountModel> => {
        const account = await db.account.findFirst({
            where: { id },
            include: { household: true }
        })

        if (!account) throw new NotFoundError()

        return account
    }
)
