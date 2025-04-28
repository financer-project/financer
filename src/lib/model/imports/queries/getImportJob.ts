import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const GetImportJobSchema = z.object({
    id: z.string().uuid()
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
    async (input) => {
        // Get the import job with its related data
        const importJob = await db.importJob.findUnique({
            where: { id: input.id },
            include: {
                columnMappings: true,
                valueMappings: true,
                _count: { select: { transactions: true } }
            }
        })

        if (!importJob) {
            throw new Error("Import job not found")
        }

        return importJob
    }
)