import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { NotFoundError } from "blitz"
import Guard from "@/src/lib/guard/ability"

const GetImportJobSchema = z.object({
    id: z.uuid()
})

export type ImportJobModel = Prisma.ImportJobGetPayload<{
    include: {
        columnMappings: true,
        valueMappings: true,
        _count: { select: { transactions: true } }
    };
}>

export default resolver.pipe(
    resolver.zod(GetImportJobSchema),
    resolver.authorize(),
    Guard.authorizePipe("read", "ImportJob"),
    async (input) => {
        const job = await db.importJob.findUnique({
            where: { id: input.id },
            include: {
                columnMappings: true,
                valueMappings: true,
                _count: { select: { transactions: true } }
            }
        })
        if (!job) throw new NotFoundError()

        return job
    }
)